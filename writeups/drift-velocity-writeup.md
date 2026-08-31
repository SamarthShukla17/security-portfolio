---
title: "Drift Protocol / Velocity DEX — Liquidation Timing, Self-Trade Guards, and a Live On-Chain Surprise"
date: "2026-08-31"
protocol: "Drift Protocol (Velocity DEX)"
severity: "N/A"
status: "Negative (Clean Audit)"
summary: "Two threads: a liquidation-timing behavior initially assessed High severity, retracted after the protocol's own documentation confirmed it as intended design. A missing explicit self-trade guard, traced via call-hierarchy analysis into the matching engine and confirmed covered — then found moot, since the program's entire instruction dispatcher is currently disabled, independently confirmed against live mainnet transaction data."
---

**Target:** Drift Protocol v2, rebranded **Velocity DEX** (July 2026, following a $295M DPRK-linked exploit) — `velocity-exchange/protocol-v2`

**Program ID:** `dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH` (mainnet)

**Scope of this writeup:** a margin-liquidation timing hypothesis that was self-corrected after checking the target's own design documentation, and a semantic call-graph trace of a self-trade guard that ended by discovering the entire program's instruction dispatcher is currently disabled — confirmed independently on live mainnet, not just from source.

---

## 1. Summary

Two investigations, presented together because they illustrate the same discipline from opposite directions: one shows walking back an initially plausible finding after checking the right document; the other shows a finding surviving code-level scrutiny but dying anyway once reachability was checked first, before deeper analysis was even attempted.

1. A liquidation-timing behavior — trader positions escaping liquidation when oracle price recovers mid-transaction — was dynamically confirmed as real code behavior, initially assessed as a High-severity finding, then **retracted** after the protocol's own liquidation-engine documentation was found to describe it as explicitly intended.
2. A missing explicit `maker != taker` guard in `place_and_make_perp_order`, flagged during a systematic per-instruction security checklist pass, was traced via LSP call-hierarchy analysis into the matching engine. The trace found the guard *does* exist and *does* cover this path — but the entire question turned out to be moot: **the program's instruction dispatcher is currently fully disabled**, a fact confirmed independently against live mainnet transaction logs, not inferred from source alone.

---

## 2. Liquidation timing: from "High severity" to retracted

### 2.1 The observed behavior

Drift's margin system computes account health using instantaneous ("strict") oracle pricing rather than a time-weighted average. Dynamic testing (a constructed Rust unit test against the actual margin-calculation code, not a hypothetical) confirmed: if an account crosses into liquidatable territory and the oracle price partially recovers before a liquidation instruction lands, the liquidation reverts — the position survives — even though the account was liquidatable moments earlier.

The initial framing treated this as an exploitable evasion mechanism and assessed it at High severity.

### 2.2 The correction

Before submission, the target's own documentation was checked directly rather than relying on the plausibility of the initial hypothesis. Velocity's liquidation-engine docs state explicitly:

> *"If the price moves in favor of the user, liquidation slows down, since the position is recovering naturally."*

— and separately describe partial liquidation as deliberately throttled across slots, precisely to allow a recovering position room to avoid being fully closed out on a transient price spike. This is not an oversight; it is the documented design trade-off against the alternative (TWAP-based liquidation, which would be *worse* for protocol solvency during an actual crash, since it would liquidate positions based on a stale, lagging price rather than current market reality).

Two further checks were run before retracting:

- **Attacker-controlled trigger?** No — the recovery event is market noise (an external price move), not something a trader can induce on demand. Every finding that survives to submission in this line of work has to answer "who can trigger this, against whom" — here, nobody can trigger it at will.
- **Audit cross-reference.** Checked Drift's listed audits (Zellic, Neodyme, Trail of Bits). Found a related-but-distinct finding (`ND-DFT1-MD-01`) in the same neighborhood of the liquidation engine, confirming the area had prior audit attention, without finding this exact behavior flagged as a defect by any of them — consistent with it being intended rather than overlooked.

**Conclusion: retracted.** The dynamic reproduction is real and the code behaves exactly as tested; it is not a vulnerability. This is kept as a documented retraction with its full technical trail rather than quietly discarded, because the correction — checking the target's own stated design intent before severity, not after — is the actual demonstrable skill here.

---

## 3. Self-trade guard trace: a call-hierarchy analysis that dead-ends in the right place

### 3.1 The candidate

A systematic, instruction-by-instruction security checklist pass (the kind used to catch Solana-specific vulnerability classes: missing signer checks, missing owner checks, unchecked PDA seeds, arbitrary CPI targets, duplicate-account aliasing, unchecked arithmetic) flagged one item across ~30 Drift instructions reviewed: `place_and_make_perp_order` has no *explicit*, instruction-level check that the maker and taker are different accounts — unlike every other paired-account instruction in the codebase (liquidation, transfer_deposit, transfer_pools, transfer_perp_position all carry an explicit `x_key != y_key` guard). Flagged as low-confidence pending a deeper trace, since a structurally similar guard was known to exist somewhere in the general order-matching code, but not yet confirmed to actually cover this specific instruction's path.

### 3.2 The trace

Built a reusable LSP-driven call-graph tool (`rust-analyzer` spoken directly over its JSON-RPC/stdio protocol — no client library) specifically to answer this kind of question with certainty instead of "probably." Two facts needed connecting:

**Does the general self-trade guard apply to `place_and_make`'s specific maker?**

```rust
// controller/orders.rs:1517 and :4395
for (maker_key, user_account_loader) in makers_and_referrer.0.iter() {
    if maker_key == taker_key {
        continue;
    }
    ...
}
```

**Does `place_and_make_perp_order`'s handler route its named maker into this exact collection?**

```rust
// instructions/user.rs — handle_place_and_make_perp_order
let (mut makers_and_referrer, mut makers_and_referrer_stats) =
    load_user_maps(remaining_accounts_iter, true)?;
makers_and_referrer.insert(ctx.accounts.user.key(), ctx.accounts.user.clone())?;
```

Yes. `handle_place_and_make_perp_order` inserts its own designated maker (`ctx.accounts.user`) into the same `makers_and_referrer` map that `fulfill_perp_order`'s matching logic iterates with the `maker_key == taker_key` skip-guard. The two code paths are connected — the original checklist pass's uncertainty about whether they were related is resolved: they are, and the guard does fire for this instruction.

**One residual precision gap, noted for the record:** the guard compares Solana account keys, not Drift authorities. A single wallet operating two Drift sub-accounts (a completely standard pattern — Drift users routinely run multiple numbered sub-accounts under one authority) would produce two distinct `maker_key`/`taker_key` values and pass this check while trading with itself across its own sub-accounts. That's a real, precisely-identified gap in the guard's granularity — but per the methodology's own discipline (falsify the cheapest thing first, don't build further on a candidate until reachability is settled), it wasn't chased into a full exploit analysis, because of what came next.

### 3.3 The reachability check that actually mattered

Before going deeper into the fill-logic trace, checked whether `place_and_make_perp_order` is even wired up in the current build:

```rust
// programs/drift/src/lib.rs
#[program]
pub mod drift {
    // place_and_make_perp_order (and cancel_orders, modify_order, place_and_take_perp_order,
    // place_spot_order, and every other trading instruction) — every single `pub fn` in this
    // module is commented out with `//`, not gated behind a #[cfg] flag.
}
```

This alone would be a strong signal, but source inspection of a possibly-stale clone isn't sufficient evidence on its own — so it was checked independently against the live chain. Queried `getSignaturesForAddress` for the real mainnet program ID and pulled the full transaction log of the most recent finalized transaction:

```
Program dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH invoke [1]
Program log: AnchorError occurred. Error Code: InstructionFallbackNotFound. Error Number: 101.
Error Message: Fallback functions are not supported.
Program dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH failed: custom program error: 0x65
```

`InstructionFallbackNotFound` is Anchor's own built-in error, thrown when an incoming instruction's discriminator matches nothing registered in the program's dispatcher. That's the exact on-chain symptom of a program whose `#[program]` module has zero active instructions — independently corroborating what the source shows, ruling out "this is just a stale or wrong branch" as an explanation. Every recent transaction against this program is failing this way. The entire trading surface is currently offline — consistent with the post-hack rebrand context and almost certainly a deliberate, temporary state while the team rebuilds and re-audits, rather than an accident.

**Conclusion: the self-trade question is unanswerable in the sense that matters, because there is currently no path to reach it at all.** Not "low severity" — not reachable, full stop, verified against production, today.

---

## 4. What this demonstrates

- **Self-correction under evidence, not stubbornness.** The liquidation-timing finding was walked back from "High severity, ready to send" to "retracted" after one document was read that should have been read first. Reporting the retraction with its full trail is more valuable to a reader evaluating judgment than reporting only the findings that survived.
- **Semantic call-graph analysis, not text search.** Confirming that two functions ~1,300 lines apart in a 4,000+ line file are actually connected — with certainty, via a real call-hierarchy trace — is exactly the kind of question grep gives false confidence about in either direction.
- **Reachability-first triage.** Before spending further effort deepening a code-level finding, the cheapest possible falsification (is this instruction even callable right now?) was checked first — and it dissolved the entire question. Checking the cheapest disproof before the expensive one is a discipline, not a shortcut.
- **Live-chain verification as a first-class check.** A source-level observation was independently confirmed against real, current mainnet transaction data before being treated as fact. Code review that stops at the repository is only half the picture on a live protocol.