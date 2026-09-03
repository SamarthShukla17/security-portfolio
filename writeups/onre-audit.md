---
title: "OnRe — configurable_vault Fee-Routing and Buffer-Accrual Trace"
date: "2026-08-28"
protocol: "OnRe"
severity: "N/A"
status: "Negative (Clean Audit)"
summary: "Eight hypotheses traced across OnRe's mint/redeem and configurable_vault subsystems: four closed negative this session (fee-destination commingling, v1/v2 accounting-regime collision, vault type confusion, missing-account value loss), two closed as textbook fixed-point noise or not pursued, and one real, math-proven buffer-accrual associativity break — currently dormant because the affected mechanism doesn't exist on mainnet yet. Nothing submittable today; the dormant finding is drafted and ready if that changes."
---

**Target:** OnRe Solana programs — mint/redeem core and `configurable_vault` fee-routing subsystem.

**Scope of this writeup:** eight hypotheses opened across two engagement sessions on OnRe's proceeds/fee accounting and buffer-accrual math, closed by falsification-first testing rather than assumption. Seven close negative or dormant; one is a real, quantified bug gated on a mechanism (`BufferState`) that isn't live on mainnet.

---

## Method

Each candidate got the same test: write the one sentence describing concrete harm to a user or the protocol, without hedging. If the sentence needs a qualifier to be true, the candidate doesn't clear the bar. Where a candidate involved shared state or dispatch, I traced the actual code paths (git archaeology on the introducing commit, instruction dispatch tables, atomicity guarantees) rather than reasoning from the diff alone.

## Hypotheses & Verdicts

**F1 — `configurable_vault` mint-path proceeds/fee commingling.** `take_offer_permissionless` (v1) routes both the proceeds and fee legs to the same boss wallet ATA instead of a dedicated vault, unlike the newer `_v2` variant. Git archaeology (`git log -S`) found the exact introducing commit and showed this wasn't an oversight — the same commit built proper vault-backed fee accounting for `_v2` specifically and deliberately left v1 untouched, preserving its existing live behavior. The concrete-harm test failed: the user pays and receives exactly what the core computation says either way, the boss receives the full correct amount either way, and the only effect is an on-chain vault balance not reflecting v1's contribution — information already available correctly split in the instruction's own event log. **Closed negative — informational at most, not a finding.**

**F2 — v1/v2 accounting-regime collision.** With v1 (live) and `_v2` (not yet live) both dispatchable, does running value through both ever double-count, lose, or misroute funds? Solana transaction atomicity forecloses this structurally: one transaction is processed start-to-finish by exactly one instruction variant, and v1 never touches the `ConfigurableVault` state `_v2` writes to — there's no shared mutable field either path could corrupt. No test needed beyond confirming that structural fact directly from the dispatch code. **Closed negative — resolved, not reachable as a bug.**

**F3 — Vault type confusion across a 9-variant enum.** Closed in a prior session: the vault's compile-time const-generic design structurally forecloses cross-variant confusion.

**F4 — Missing-account silent value loss.** Closed in a prior session: every code path either auto-creates the missing account or reverts cleanly — no silent-skip path exists.

**H1 — Off-chain pricing formula divergence from on-chain.** Traced whether a stale off-chain pricing formula (`onre-titan`) diverges from the on-chain path actually serving live quotes. Confirmed the stale formula isn't what's serving live Jupiter quotes today, but it's also confirmed *not* vestigial on an actively-worked feature branch. **Dormant watch-item, not submittable** — no live route uses it today, and reporting risk in an unmerged branch outside the in-scope asset isn't a submission.

**H2 — Mint/redeem rounding bias from fixed-point exponentiation.** Verified real, but bounded to ~10⁻⁹ relative, non-compounding (proven by splitting a redemption into up to 10,000 pieces and checking for drift), and symmetric across mint and redeem. **Closed — textbook fixed-point noise, not a bug.**

**H3 — Buffer-accrual associativity break.** The one real result of this engagement: a step-vs-jump accrual computation that's provably one-directional across 60 of 60 tested combinations, worth roughly 10.4%/year at the tested parameters, mechanism fully traced and a submission-quality writeup drafted. It stays dormant because `BufferState` — the account the bug lives in — does not exist on mainnet, confirmed by a fresh liveness check at close-out. **Real, quantified, submission-ready — but pointed at a mechanism that isn't currently deployed.** Submitting a dormant bug is a legitimate call, just not one this trace makes automatically.

**H4 — Buffer fee-split precision at small delta.** Never started this engagement; not carried forward.

## Why Nothing Shipped Today

Four candidates closed negative on concrete-harm or structural grounds, two closed as bounded/non-issues, one was never pursued, and one — H3 — is real and proven but currently inert because its own mechanism isn't live. That last case is worth being explicit about rather than folding into a blanket "clean audit": OnRe wasn't clean because nothing was found, three of the four `configurable_vault` candidates specifically needed real tracing to rule out, and the buffer-accrual bug is genuine work sitting ready, waiting on a deployment that hasn't happened. A reasoned negative and a dormant, drafted finding are both real deliverables — neither is a bug found on demand, and neither should be inflated into something it isn't.
