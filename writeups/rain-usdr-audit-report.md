---
title: "RAIN-USDR — Audit Contest Report: Five Findings (4 High, 1 Medium)"
date: "2026-11-05"
protocol: "Rain Protocol (USDR)"
severity: "High"
status: "Confirmed"
pdf: "/reports/RAIN-USDR_Smart_Contract_Audit_Report.pdf"
summary: "My findings from the RAIN-USDR audit contest on HackenProof (September 2026): four High and one Medium, each rated by triage and reproduced with an executed Foundry proof of concept on the pinned scope commit, plus one report I narrowed to Informative myself, and why."
---

Published with the program's permission. Severity labels are the ones assigned by HackenProof triage; where my own assessment differed, both are stated.

## Engagement

- **Program:** RAIN-USDR Smart Contract Audit Contest, on HackenProof, September 2026
- **Target:** Rain Protocol's USDR stablecoin, a MakerDAO-style collateralized debt engine with a peg stability module, a reserve-accounting and solvency layer, a permissionless liquidation trigger, and an emergency shutdown (`End`) module
- **Repository:** `github.com/hackenproof-public/rain-usdr-contracts`
- **Scope commit:** `bd6e03abe34936b7dbece2509b90457bd5c9b119` (pinned)
- **Toolchain:** Foundry, forge 1.8.1, using the repository's own `BaseTest` harness

I submitted seven reports. Five were confirmed by triage: four High and one Medium. One was closed as Informative (the one I narrowed myself, below) and one was closed as out of scope.

The scope commit is not reachable from any branch through normal `ls-remote` or tag enumeration, but it can be fetched directly. I verified its identity during the audit after an initial scope-note error, and reproduced two of the findings against main HEAD as well where noted.

## Method

Every submission was framed as a **capability delta**: a precise statement of what an attacker (or, in two cases, an honest user or ordinary protocol revenue) can do after the bug that they could not do before. That discipline keeps a report tied to a demonstrable change in behavior rather than a code smell, and it worked in both directions: one report was withdrawn to Informative once my own follow-up showed the apparent gap added no new capability.

Each confirmed finding is demonstrated by an executed proof of concept, not a narrative argument:

- a standalone test file added under the repository's own `tests/` or `tests/audit/`, with **no existing file modified**
- run on a fresh clone pinned to the scope commit
- with the full original suite re-run alongside every addition, to show no regression

Severity went through two steps. I attached a self-assessment, including its conditioning assumptions, to every submission; triage then confirmed or adjusted it. Where the two diverged, both positions are kept below.

## Findings at a glance

- **RAINUSDR-1746** (High): Honest in-cap redemption breaches the solvency invariant
- **RAINUSDR-1739** (High): Same-transaction collateral top-up/withdraw bypasses the redemption cap
- **RAINUSDR-1676** (High): `worstCaseLoss()` never reads `vice` after a permissionless `bark()`
- **RAINUSDR-1668** (High): `End.skip()` has no post-flow guard; call-ordering strands ~53% of a redemption pot
- **RAINUSDR-1303** (Medium): BalanceSheet's surplus floor can permanently block `End.thaw()`
- **RAINUSDR-1307** (Informative, closed): stale `ilk.spot` in `frob()`; not a finding

The unifying pattern: each component was built correctly in isolation, but their composition leaves windows where the protocol's own safety arithmetic disagrees with itself. A redemption sized exactly to the published cap trips the breach rule; a same-transaction collateral top-up depresses the loss aggregate long enough to pass the same cap; a permissionless liquidation call shrinks the reported worst-case loss without recovering any debt; call-ordering during shutdown strands roughly half of a redemption pot; and ordinary liquidation revenue can permanently block the shutdown pipeline itself.

## RAINUSDR-1746: Honest in-cap redemption breaches the solvency invariant

**Severity:** High. **Components:** `ReserveAccounting`, `SolvencyEngine`, `PegStabilityModule`.

**Capability delta.** Before this bug, a holder redeeming anything up to the protocol's own stated free-slack cap was assumed to leave the system solvent. With it, the same fully honest, in-cap redemption pushes the system into breach, freezing an unrelated healthy borrower's withdrawal and blocking further redemptions and surplus distribution.

**Root cause.** `freeSlack()` (`ReserveAccounting.sol:87-89`) is computed against `committedEscrow = min(loss, reserve)`. The breach test in `SolvencyEngine.checkInvariant` (`SolvencyEngine.sol:221`) is equivalent to `reserve < loss / 0.9`, a stricter bound by the reserve factor (0.9). `buyStable` (`PegStabilityModule.sol:217-233`) checks only the pre-redemption breach state and that the amount is within `freeSlack()`; it never checks the post-redemption state. For loss L > 0, any redemption that leaves the reserve in [L, L/0.9) is permitted by the slack rule but trips the breach rule.

**Worked example.** Reserve 100,000, loss 30,000, so escrow 30,000 and `freeSlack` 70,000. Redeeming exactly 70,000 leaves reserve 30,000, which is less than 30,000 / 0.9 = 33,333.33, so the system is in breach. The largest redemption that avoids breach is 66,666.67, not 70,000.

**Adjacent defense, missed here.** The team's own boundary test (`tests/Reserve.t.sol:380-401`, `test_redemptionBoundedByFreeSlack`) exercises exactly this boundary and asserts the pre-redemption slack value, but never asserts the post-redemption state. The cap the bug lives at was tested; what happened after crossing it honestly was not.

**Impact.** Executed PoC (reserve 100,000e18, loss 30,000e18): one holder calls `buyStable` for exactly the honest free slack (70,000e18) and it succeeds. The reserve afterward is 30,000e18 and `isBreached()` becomes true. An unrelated borrower with a healthy 400% vault then cannot withdraw collateral (`frob` reverts `SolvencyGateActive`), further `buyStable` calls revert, and `distributeSurplus` is blocked.

**Recommended fix.** Commit the escrow as `loss / reserveFactor` rather than `loss`, so `freeSlack` reflects the amount that can actually leave without tripping the breach rule. Disclosed trade-off: this changes the slack figure used by my PoC and by the team's own `test_redemptionBoundedByFreeSlack`, and shrinks the fixture used by the related 1739 variant. Adopting it is a team decision about intended slack size, not a silent patch.

**Verification.** Fresh clone pinned to `bd6e03ab`; standalone PoC added to `tests/`, no existing file modified. `forge test --match-test test_bonus_honestFullSlackRedemptionTripsBreachAndFreezesBorrowers` passes; the full suite (167 tests: 166 original plus 1 new) passes with no regression.

## RAINUSDR-1739: Same-transaction collateral top-up/withdraw bypasses the redemption cap

**Severity:** High. **Components:** `SolvencyEngine`, `VaultEngine`, `PegStabilityModule`.

**Capability delta.** Before this bug, `buyStable`'s free-slack check was meant to cap redemptions at what the protocol could safely spare, computed from a `worstCaseLoss` aggregate assumed to be manipulation-resistant within a single transaction. With it, any address can post collateral in a debt-free vault, redeem past the honest cap while that collateral temporarily depresses the loss aggregate, then withdraw the same collateral, all atomically and at zero net cost, leaving the protocol in breach.

**Root cause.** `worstCaseLoss` (`SolvencyEngine.sol:254-276`) is computed per-ilk from `globalArt` / `globalInk`; posting collateral anywhere lowers it, including in a debt-free vault. `checkInvariant()` recomputes it at redemption time by design (to avoid stale-escrow advantages for early redeemers), but `frob`'s solvency gate only fires when `dart > 0 || dink < 0` (`VaultEngine.sol:463-471`). A pure collateral top-up (`dink > 0`) is never gated, and the gate is check-before-effect, so a later withdrawal is evaluated against a world where the collateral is still posted.

**Impact.** Executed PoC: the baseline `buyStable(90,000 USDT)` correctly reverts `InsufficientFreeSlack`. The same redemption succeeds after a 300,000e18 RAIN top-up/withdraw wrapped around it, with all RAIN returned; the protocol ends breached (loss 30,000e18 against reserve 10,000e18). A full-drain variant takes the entire reserve to 0 while debt is unchanged. A debt-side variant (repay, redeem, redraw, no collateral movement) achieves the same result. The whole attack, including the variants, runs in one transaction: 446,446 gas (about 1.5% of the block gas limit), zero fee cost, full collateral returned.

**Recommended fix.** Move the solvency gate in `VaultEngine.frob` from pre-effect to post-effect, scoped to risk-increasing directions (`dart > 0 || dink < 0`). This blocks the collateral-side, debt-side and atomic variants. A narrower post-check limited to `dink < 0` is insufficient, since the debt-side variant moves no collateral at all.

**Verification.** Fresh clone pinned to `bd6e03ab`; a 5-test standalone PoC file (baseline, attack, full-drain, debt-side variant, atomicity) passes; the full suite (171 tests: 166 original plus 5 new) passes with no regression.

## RAINUSDR-1676: `worstCaseLoss()` never reads `vice` after a permissionless `bark()`

**Severity:** High (triage). My self-assessment was Low-Medium, leaning Medium, pending triager input on real operating distance from the breach threshold; triage confirmed High on the strength of the persistence evidence below. **Components:** `SolvencyEngine`, `LiquidationTrigger`, `BalanceSheet`.

**Capability delta.** Before this bug, the reserve-adequacy gate (`checkInvariant`) that protects peg-stability redemptions and new debt draws was meant to reflect the protocol's true stressed shortfall at all times. With it, anyone can call the permissionless `bark()` on an unsafe vault and immediately shrink the reported loss, even though the true shortfall is unchanged or (once the liquidation's own keeper incentive is counted) slightly worse, reopening redemption and draw gates that should remain closed.

**Root cause.** `worstCaseLoss()` (`SolvencyEngine.sol:246-293`) loops only `volatileIlks`, reading `globalArt` / `globalInk` / `rate`; it never reads `vice`, `sin`, `debt`, `usdr`, or the auction contract's held collateral. `bark()` leads to `grab()`, which moves a liquidated vault's debt and collateral out of those per-ilk aggregates into `vice` and the auction contract respectively (`LiquidationTrigger.sol:260`), both of which `worstCaseLoss()` ignores. The reported loss therefore drops the moment `bark()` runs, regardless of whether the debt it removed is actually recovered.

**Measured effect.** The worked example drops `worstCaseLoss()` from 354.675 to 300.000 after `bark(V1)` (a change of -54.675). Accounting for the keeper incentive minted via `suck` into `vice` during `kick`, the true post-bark stressed loss is 356.935, so the real gap is 56.935, larger than the naive before/after delta. A peg-stability redemption that correctly reverts `SolvencyGateActive` before `bark()` succeeds after it, and a `frob` draw shows the same before/after flip.

**Persistence: the deciding evidence for severity.** In the common case (full auction recovery) the gap self-heals once `flog` and `BalanceSheet.heal()` run, both permissionless but not automatic. In a deeper-crash scenario (price at $0.15 before `bark`), 20.675 remains permanently stuck in `vice` after `flog` and `heal()`, uncounted by `worstCaseLoss()` until fee surplus happens to cover it: a genuine non-temporary regime, not just a modeling curiosity.

**Who can trigger it.** `bark()` carries no role modifier beyond live / not paused / vault is unsafe. It is fully permissionless, bounded in magnitude by the liquidation caps (`hole` / `dirt`).

**Recommended fix.** Include `vice` (net of the auction contract's still-recoverable collateral) in `worstCaseLoss()`'s computed loss, since debt moved there by `grab()` is not backed by recoverable collateral the way `globalArt` debt is. A naive addition of `vice` would overcount while an auction is still live.

**Verification.** Fresh clone pinned to `bd6e03ab`, repository's own `BaseTest` harness, forge 1.8.1. A 5-test standalone file in `tests/audit/` passes; the full repository suite passes unmodified alongside it.

## RAINUSDR-1668: `End.skip()` has no post-flow guard; call-ordering strands ~53% of a redemption pot

**Severity:** High. **Components:** `End` (emergency settlement).

**Capability delta.** Before this bug, calling `thaw()` / `flow()` during emergency shutdown was meant to fix a redemption price that accounts for all collateral, including any in-flight liquidation. With it, anyone can use the wrong call order to get `flow()` to fix the redemption price *before* `skip()` restores an in-flight auction's seized collateral and debt into the shutdown snapshot, permanently stranding that collateral from every USDR holder's redemption, with no recovery path, since `fix` is computed once and never recalculated.

**Root cause.** `skip()` restores debt seized by in-flight auctions into the cage-time snapshot but carries no `debt == 0` / `fix == 0` guard, so it can still be called, with no effect on redemptions, after `flow()` has already fixed the price. `cage(ilk)`, `thaw()` and `flow()` are all permissionless and can be sequenced in any order, including the hazardous one, by anyone, even within a single transaction.

**Impact.** Executed PoC: the control order (`skip`, `thaw`, `flow`) strands 0. The hazard order (`thaw`, `flow`, `skip`) leaves `End` holding 354.999 of collateral value, but the fixed price lets users redeem only 166.666 to 188.333, so about 53% of the pot is permanently stranded, matching exactly the one in-flight auction's confiscated collateral (113 debt / 0.6 price).

**Mitigating and conditioning factor.** If `End.wait` is nonzero, there is a window during which every in-flight auction can be `skip()`'d before `thaw()` becomes callable. Severity depends on the production value of `End.wait` (not determinable from the public repo) and on whether a documented shutdown runbook guarantees that ordering. I flagged High for the `wait == 0` case (matching the test harness default, where `thaw` / `flow` can follow `cage` in the same transaction with no defensive window) as my own judgment, explicitly asking the triager to confirm or correct it; triage confirmed High.

**Relationship to RAINUSDR-1303.** No overlap: 1303 concerns whether `thaw()` can be called at all (the BalanceSheet surplus floor); this finding concerns the collateral-accounting consequence of calling `thaw()` / `flow()` / `skip()` in the wrong relative order once `thaw()` is reachable.

**Recommended fix.** Guard `flow()` / `thaw()` against outstanding (non-yanked) auctions before fixing the redemption price, and/or revert `skip()` once `fix` has been computed for that ilk. A `skip()`-side guard alone would leave the affected auction's collateral permanently unreclaimable, so the `flow()`-side guard is what actually prevents the loss.

**Verification.** Fresh clone pinned to `bd6e03ab` (also independently reproduced against main HEAD `5e6be73` before the pinned commit's existence was confirmed), using the repository's own `BaseTest` harness. A standalone test file in `tests/audit/` exercises both the control and hazard orderings; the full suite (184 of 184, including the addition) passes unmodified.

## RAINUSDR-1303: BalanceSheet's surplus floor can permanently block `End.thaw()`

**Severity:** Medium (triage). I rated it High per CVSS (7.5) but stated I would accept Medium given the ward-gated recovery path below. **Components:** `End`, `BalanceSheet`.

**Capability delta.** Before this bug, `End.thaw()` was meant to be reachable during emergency shutdown once bad debt was reconciled, unlocking `flow()`, `pack()` and `cash()` for every USDR holder. With it, ordinary chop-penalty revenue from a single normal liquidation, not an attacker, permanently seeds BalanceSheet's internal USDR balance above zero in a way no permissionless call sequence can ever sweep back to zero, so `thaw()` reverts indefinitely and the entire emergency settlement pipeline halts.

**Root cause.** `End.thaw()` requires the BalanceSheet's internal USDR balance to be exactly zero (`End.sol:306-308`). `distributeSurplus()` ships only `surplus - humpTarget()` and returns early once surplus is at or below target (`BalanceSheet.sol:180`). `humpTarget()` is a hard floor, nonzero under the protocol's own intended configuration (a buffer is the feature's purpose), so `distributeSurplus()` can never, by design, sweep the last target-worth of surplus. `heal()` requires un-queued `sin` to net against, and none remains once bad debt is cleared. `End.cage()` cages `VaultEngine`, `LiquidationTrigger` and `PriceConverter`, but `IBalanceSheet` has no `cage()` method at all, so no reconciliation of this balance ever happens at shutdown.

**Contrast with the adjacent defense the team already built.** MakerDAO's `Vow.cage()` unconditionally heals `min(dai, sin)` and zeroes the surplus/debt queues at shutdown, and Maker's `hump` is a soft threshold whose surplus above it stays reachable through repeated auctions. Rain's `humpTarget` is a hard floor that `distributeSurplus()` returns early against by design. The team built the buffer mechanism correctly for steady-state operation but never carried the equivalent of `Vow.cage()`'s reconciliation into their own shutdown path.

**Impact.** `thaw()`, and therefore `flow()`, `pack()` and `cash()`, become unreachable. No ilk's `fix[]` is ever computed, no USDR holder can redeem, and every vault owner whose collateral was already `skim`'d into `End` loses access to it for as long as the freeze lasts. This is exactly the emergency path the protocol depends on when everything else has already failed.

**Recovery path: bounds severity, disclosed against my own interest.** A ward can call `balanceSheet.file("humpRate", 0)` or `file("humpFloor", 0)` (no bounds check, callable post-cage); `distributeSurplus()` then sweeps the residual and `thaw()` succeeds, which is asserted in the PoC. I rated High per CVSS (7.5) but stated I would accept Medium given this ward-gated path; HackenProof triage set Medium.

**Recommended fix.** Add `BalanceSheet.cage()` that zeroes `humpTarget` and sweeps residual surplus to the vault engine, invoked from `End.cage()` alongside the other three modules.

**Verification.** Fresh clone at main HEAD `5e6be73d34bdc3450c5db0f7d5db5c68a2011242` (after a scope question I raised in the program's Discord support channel), using the repository's own `VaultEngine` / `OracleSecurityModule` / `PriceConverter` pipeline with only the external price feed stubbed. My standalone test drives a real `bark`, `kick`, `take` liquidation generating only organic chop-penalty surplus (`suck` appears only in disclosed bootstrapping comments, never to manufacture the surplus), and asserts the freeze and the ward-gated recovery.

## RAINUSDR-1307: Stale `ilk.spot` in `frob()` (Informative, closed; not a finding)

**Claim as submitted.** `VaultEngine.frob`'s safety check reads `ilk.spot` with no staleness or age check. `PriceConverter.poke` (the only writer of `spot`) runs independently of `OracleSecurityModule.poke` (the only writer of the live price `cur`), so `spot` could in principle lag `cur` indefinitely, letting a mint be sized against a stale, pre-crash valuation.

**Why it did not hold up as a capability delta.** Triage, and my own follow-up sweep after an initial scope-note correction, established that every draw in the stale-spot table is one the vault could already make just before `OracleSecurityModule.poke` promotes the lower price. Until promotion, `OSM.cur`, the cached `spot`, and the reserve-wide solvency gate all still reflect the same (not-yet-superseded) value. Promoting the price first and drawing second adds no additional borrowing capacity: the apparent gap is a timing artifact, not a new capability, and is the same design as the MakerDAO `Spotter` pattern (bounded only by when someone calls the permissionless `poke`). My crash-depth sweep (0.90 down to 0.20) showed the stale-spot draw permitted at every depth tested, and my reserve sweep showed the reserve-wide solvency gate (added after my original submission) only binds at a literally zero reserve; at any funded reserve, headroom dwarfs the loss from one attacker vault by about 78x. HackenProof triage closed it as Informative, noting the same root cause had been reported earlier.

**Included for completeness.** This report did not pay out. It is here because the correction thread documents the capability-delta discipline I applied in reaching "not a finding", and a record that only shows the reports that survived would overstate the hit rate.

## Reproducing

Clone `github.com/hackenproof-public/rain-usdr-contracts`, fetch and check out the pinned scope commit `bd6e03abe34936b7dbece2509b90457bd5c9b119`, install Foundry, and run `forge test` with the PoC test files added as described above. The PoC files are standalone additions: no existing test is modified in any verification run, and every full-suite count quoted here was produced by the repository's own suite running unmodified alongside the added file.
