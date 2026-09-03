---
title: "Alberich Token — Remediation-Diff and Four-Angle Trace"
date: "2026-09-02"
protocol: "Alberich Token (ALBRH)"
severity: "N/A"
status: "Negative (Clean Audit)"
summary: "HackenProof contest pass on a single deployed ERC20 contract, freshly remediated post-Hacken-audit. Every prior finding's fix verified complete against live bytecode, then four additional attack angles (state-machine, adversarial third-party, permanent-lock, griefer-no-profit) walked with no candidate surviving falsification. Theft- and lock-only scope; nothing else applied here."
---

**Target:** deployed `AlberichToken` contract (Ethereum mainnet), pulled via Sourcify full-match verification against the Hacken-remediated source. Contest scope: theft of user funds or permanent lock only — no PoC, no submission on anything else.

## Method

Two passes. First, a remediation diff: does each fix from the prior Hacken audit actually close what it claims to, completely, without opening a sibling gap? Second, four attack angles the first pass doesn't cover on its own — state-machine/sequencing, adversarial third-party, permanent-lock, and griefer-with-no-profit-motive — walked explicitly rather than assumed clean by extension.

## Remediation Diff

Six of seven prior Medium/Low findings verified fixed and complete in the deployed bytecode. The one worth detailing: an earlier fix removed a freeze restriction on `setRoundType` to unblock multi-round sales, and a later finding caught that `_purchase()` — the one token-outflow path that fix touched — wasn't checking the vesting reserve the other two outflow paths (`ringForgedBurn`, `transferAllocation`) already gated on. Sale traffic could drain the reserve and permanently brick vesting claims. The current deployed code closes this: all three outflow paths now consistently check `balanceOf(this) - reservedForVesting` before moving tokens. Traced every path that reduces the contract's own balance to confirm no sibling gap remains. One Low finding (no `cancelVesting` recovery) is accepted-not-fixed by the team, but it only affects the foundation's own unclaimed treasury allocation — not end-user funds — and is privileged-only to trigger either way. Out of scope on both counts.

## Four Angles, Walked Explicitly

**State-machine/sequencing.** Mapped every transition boundary — freeze, round-switch, vesting set→claim→re-set, pause/unpause, foundation handoff. Round-switch caps are separate, monotonic per-round counters that a switch can't reset or replay. The freeze boundary correctly blocks all sale paths pre-freeze, so nothing carries an invalid value across it. Foundation handoff is atomic (role revoke/grant in one transaction) — no window with zero or dual valid foundations. Clean.

**Adversarial third-party.** Every state-writing entry point keys strictly to `msg.sender` — no `claim-for-X` or `register-for-X` pattern exists anywhere. Stress-tested the one plausible griefing shape (spam-buying to starve a vesting beneficiary's reserve) directly against the same `unlockedBalance` gate the remediation diff established: once the unlocked portion is exhausted, further purchases simply revert — they can't dig into the reserved portion. Confirms the fix holds under a pure-griefing lens, not just a self-profit one. Clean.

**Permanent-lock lens.** Enumerated every `exists`/`initialized`/`reserved` flag that could brick a withdrawal. Every write path to every one of them is privileged-gated. No blacklist mechanism exists in this contract at all — the taxonomy's blacklist-lock vector structurally doesn't apply here. Re-verified the balance-vs-reserve invariant can't be forced to underflow by any unprivileged path, which forecloses the one scenario that would've been a systemic lock affecting every user at once. Clean.

**Griefer-with-no-profit-motive.** Cheapest-possible actions (1-wei purchase, dust donation straight to the contract, calling gated functions with no standing) either revert with no state change or, in the donation case, only ever increase the unlocked buffer. No squattable initializer, no unbounded loop reachable by an unprivileged caller, no shared accumulator a legitimate call can poison for the next caller. Clean.

## Result

Closed negative across both passes. The one seam worth being honest about — the vesting-reserve accounting across all three outflow paths — was exactly the right place to look, and it turned out to be the one place the team's own remediation had already caught and closed consistently. Nothing in the remaining small fund-movement surface (no fee-on-transfer, no rebase, no blacklist, no AMM hook) offered an unprivileged theft or permanent-lock vector under any of the four angles walked.
