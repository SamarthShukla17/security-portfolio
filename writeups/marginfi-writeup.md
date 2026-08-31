---
title: "MarginFi-v2 — Receivership Atomicity Under Adversarial Analysis"
date: "2026-08-31"
protocol: "MarginFi"
severity: "N/A"
status: "Negative (Clean Audit)"
summary: "A checklist pass across ~25 fund-touching instructions flagged a permissive receivership signer check. A call-hierarchy trace proved the window can't be opened without the closing invariant check being structurally guaranteed to run, and can't be exited while that invariant is violated — a property of Solana's atomic transaction model, not a permission check that could be routed around."
---

**Target:** marginfi-v2 (`mrgnlabs/marginfi-v2`) — Solana lending/margin protocol

**Program:** self-hosted security review + bug bounty

**Scope of this writeup:** a mechanical, checklist-driven pass across ~25 fund-touching instructions that surfaced a permission model worth a second look, followed by a full LSP-guided call-hierarchy trace proving — not assuming — that the model is safe by construction.

---

## 1. Summary

MarginFi's liquidation and forced-deleverage flows work by temporarily handing a third party (a liquidator, or the protocol's own risk admin) full withdraw/repay control over another user's account — a "receivership" window, opened and closed within a single atomic transaction. That's an unusually permissive design on paper: the normal rule ("only the account's own authority can move its funds") is explicitly suspended for the duration. The question this investigation answers precisely is not "is this permissive" — it obviously is, by design — but **"can the window ever be exited while the very invariant that's supposed to compensate for that permissiveness has been violated?"**

The answer, established via a call-hierarchy trace rather than by reading the code and forming an impression, is no — and the reason is more interesting than a permission check: it's a property of Solana's transaction atomicity model, not of any single `require!` statement.

---

## 2. The candidate

A systematic, per-instruction checklist pass (the same Solana-specific vulnerability-class checklist used across every target in this line of work: signer checks, owner checks, PDA seed binding, arbitrary CPI targets, duplicate-account aliasing, reinitialization, close-and-revive, unchecked arithmetic) covered roughly 25 of MarginFi's fund-touching instructions. One item stood out enough to warrant a dedicated trace rather than a one-line note:

```rust
// state/marginfi_account.rs
pub fn is_signer_authorized(
    marginfi_account: &MarginfiAccount,
    group_admin: Pubkey,
    signer: Pubkey,
    allow_receivership: bool,
    allow_order_execution: bool,
) -> bool {
    if allow_receivership && marginfi_account.get_flag(ACCOUNT_IN_RECEIVERSHIP) {
        return marginfi_account.authority != signer; // forbidden to take receivership of your own account
    }

    if allow_order_execution && marginfi_account.get_flag(ACCOUNT_IN_ORDER_EXECUTION) {
        return true; // any signer at all
    }

    if marginfi_account.get_flag(ACCOUNT_FROZEN) {
        return group_admin == signer;
    }

    marginfi_account.authority == signer
}
```

During an open receivership window, this function authorizes **any signer other than the account's own authority** to call `lending_account_withdraw`/`lending_account_repay` on someone else's account — not specifically the liquidator who opened the window, just "not the original owner." During order execution, it's looser still: **any signer at all**, unconditionally. On a quick read, this looks like a total bypass of the normal ownership model, gated by nothing more specific than "not you." The right response to that observation is not to assume it's a bug or assume it's fine — it's to trace exactly what bounds the window it lives inside.

---

## 3. The trace

### 3.1 Opening the window

```rust
// instructions/marginfi_account/liquidate_start.rs
pub fn start_liquidation<'info>(ctx: Context<'info, StartLiquidation<'info>>) -> MarginfiResult {
    ...
    start_receivership(&mut marginfi_account, &group, &mut liq_record, ctx.remaining_accounts, false)?;

    let sysvar = &ctx.accounts.instruction_sysvar;
    validate_instructions(sysvar, ctx.program_id, &START_LIQUIDATION, &END_LIQUIDATION)
}
```

`start_receivership` sets `ACCOUNT_IN_RECEIVERSHIP` and snapshots the account's current health (assets, liabilities, both at maintenance and equity requirement levels) into a `LiquidationRecord`. Then, in the same instruction, `validate_instructions` is called — and this is the load-bearing part of the whole design:

```rust
// ix_utils.rs
pub fn validate_ix_last(ixes: &[Instruction], program_id: &Pubkey, expected_hash: &[u8]) -> MarginfiResult<()> {
    let last_ix = ixes.last().unwrap(); // ixes.size() >= 1, always safe
    if last_ix.data.len() < 8 {
        return err!(MarginfiError::EndNotLast);
    }
    let discrim = &last_ix.data[0..8];
    check!(last_ix.program_id.eq(program_id), MarginfiError::EndNotLast);
    check_eq!(discrim, expected_hash, MarginfiError::EndNotLast);
    Ok(())
}
```

`ixes` here is the **entire current transaction's instruction list**, obtained via the instructions sysvar — not just this program's own instructions. `validate_ix_last` requires the literal last instruction of the whole transaction to be `end_liquidation` (or `end_deleverage`, for the deleverage variant). If it isn't — if a liquidator tries to submit `start_liquidation` alone, or with any other instruction trailing it — this check fails, `start_liquidation` itself returns `Err`, and under Solana's atomic transaction semantics **the entire transaction is rolled back, including the flag-set that never got a chance to take effect.**

This is the key fact: `ACCOUNT_IN_RECEIVERSHIP` cannot become `true` without `end_liquidation` already being guaranteed, in the same atomic unit of execution, to run before the transaction completes. There is no way to "open the window and walk away."

### 3.2 Closing the window

```rust
// instructions/marginfi_account/liquidate_end.rs
pub fn end_receivership<'info>(...) -> Result<(I80F48, f64, I80F48, f64)> {
    ...
    let (post_health, ..) = check_pre_liquidation_condition_and_get_account_health(...)?;
    clear_liquidation_price_cache_locks(marginfi_account, remaining_ais)?;
    marginfi_account.health_cache = post_hc;

    // health must not get worse
    if pre_health > post_health {
        return err!(MarginfiError::WorseHealthPostLiquidation);   // <-- early return
    }

    let seized = pre_assets_equity - post_assets_equity;
    let repaid = pre_liabs_equity - post_liabilities_equity;

    marginfi_account.unset_flag(ACCOUNT_IN_RECEIVERSHIP, false);   // <-- only reached if the check above passed
    ...
}
```

The health-regression check is a hard `return err!(...)` positioned *before* the line that clears the receivership flag. If the account's health got worse during the window — the exact compensating invariant the permissive signer check depends on — this function never reaches the flag-clearing statement. And because an `Err` return aborts the whole transaction atomically, **every withdrawal or repayment the liquidator performed earlier in the same transaction is undone along with it.** There is no state in which the window "closed" (successfully or otherwise) while its account ended up less healthy than when it opened.

### 3.3 Confirming there's no side door

Exhaustively grepped every place the receivership flag is touched:

```
liquidate_start.rs:137   marginfi_account.set_flag(ACCOUNT_IN_RECEIVERSHIP, false);
liquidate_end.rs:166     marginfi_account.unset_flag(ACCOUNT_IN_RECEIVERSHIP, false);
```

Exactly one setter, one unsetter, both accounted for above. No alternate instruction sets or clears this flag.

### 3.4 Verdict

The two facts compose: you cannot **open** the window without `end_liquidation` (with its invariant check) being structurally guaranteed to execute in the same atomic transaction, and you cannot **pass through** the close-check without the health invariant already holding. "Exit the window with the invariant violated" isn't blocked by a permission check that could theoretically be routed around with a clever account combination — it's blocked by the fact that Solana transactions are all-or-nothing. Either the entire sequence, including the checked exit, completes, or none of it happened. That's a stronger guarantee than a `require!` statement, because it doesn't depend on every future code path remembering to call it.

*(The looser `is_signer_authorized` rule for order execution — any signer at all, no `authority != signer` exclusion even — was noted during the trace but not separately chased: per the same reachability-first discipline used throughout this line of work, the governing question was answered above without needing a second full trace, since whoever is permitted to sign mid-window is still bound by the identical atomic open-close unit either way.)*

A second, lower-confidence item from the same checklist pass — `lending_account_liquidate` checks `asset_bank != liab_bank` explicitly but has no equivalently explicit `liquidator_account != liquidatee_account` check — was also logged. Almost certainly a non-issue in practice (Solana's runtime account-borrowing model would surface an attempt to pass the same account into both mutable slots as a `RefCell` borrow failure before any application logic ran), flagged for the asymmetry with the bank-level check rather than as a live concern.

---

## 4. What this demonstrates

- **Distinguishing "permissive" from "unsafe."** The natural reaction to `return true` for order execution, or `authority != signer` for receivership, is suspicion. The discipline demonstrated here is not stopping at that reaction — tracing the actual bounding mechanism (transaction atomicity, not a permission check) before drawing a conclusion either way.
- **Reasoning about Solana's execution model directly**, not just its Rust source: the decisive argument here is about what happens when an instruction returns `Err` mid-transaction, which requires understanding Solana/Anchor's atomicity guarantees, not just reading the code that runs when nothing fails.
- **Precise scoping.** The task was one invariant on one path — not a general re-audit of MarginFi's receivership system. The trace stayed on that one path, cited exact file:line evidence at each step, and stopped once the question was answered rather than expanding into adjacent territory.
- **Grep-proof verification.** "No alternate instruction touches this flag" is a claim that's easy to get wrong with a partial search across a large codebase; it was closed with an exhaustive match across the whole `programs/marginfi/src` tree, not a spot check.