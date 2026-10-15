---
title: "ADI Predictstreet — Prediction Market Security Review"
date: "2026-10-15"
protocol: "ADI Predictstreet"
severity: "N/A"
status: "Engagement"
chain: "EVM · Solidity 0.8.31"
scope: "~3,603 nSLOC, 22 contracts"
highlights:
  - "23 hypotheses"
  - "3-pass review"
  - "Defense catalog"
summary: "A three-pass adversarial review of a prediction market that is an official FIFA World Cup 2026 partner: a Polymarket-fork exchange, Gnosis Conditional Tokens, a neg-risk multi-outcome adapter, per-user vaults, and a two-phase oracle. 63 invariants documented and 23 hypotheses tested. The portable output is a catalog of the defenses the team got right."
---

**Platform:** HackenProof

**Protocol:** ADI Predictstreet, a prediction market and official FIFA World Cup 2026 partner

**Language:** Solidity 0.8.31, Cancun EVM

**Scope:** ~3,603 nSLOC across 22 contracts

**Prior audit:** a 23-finding HackenProof audit, remediated before this review began

---

## Target Overview

Predictstreet puts several well-known components together, and most of the risk sits where they connect:

- **Exchange:** a Polymarket-fork CTF exchange, with operator-matched orders signed under EIP-712
- **Conditional Tokens:** the Gnosis CTF framework for outcome positions (split, merge, redeem)
- **Neg-risk adapter:** turns a set of binary questions into one multi-outcome market, backed by wrapped collateral
- **Per-user vaults:** each user's funds sit in their own vault contract, with a ledger and dual-signature authorization
- **Two-phase oracle:** results are proposed, can be challenged with a bond, and then finalize

Each component is well studied on its own. The questions worth asking are about what happens when they're combined: a convert landing next to a resolution, an emergency drain next to an in-flight settlement, a vault ledger next to an ERC1155 callback.

## Methodology

Three passes, each going deeper than the last.

**Pass 1: map, then attack.** I started with an architecture map of every contract, role, external call, and fund-moving path. From that I built an invariant ledger of 63 invariants the code depends on, each tied to a file:line source and marked as either untested or already covered by the prior audit. Reading against that ledger produced 14 leads: patterns that looked suspicious but weren't yet claims. Each lead then became an adversarial hypothesis and was tested.

**Pass 2: interactions.** Pass 1 tests each surface mostly on its own. Pass 2 added 6 hypotheses aimed at what happens between surfaces: cross-function sequencing, math edge cases in redemption and conversion, and chains of operations where each step is valid but the sequence might not be.

**Pass 3: final verification.** Reentrancy timing during atomic resolution, deployment configuration, and pulling the defense catalog below out of everything the earlier passes had killed.

**Total: 23 adversarial hypotheses, each with a verdict backed by file:line citations.**

Two rules applied to every hypothesis:

- **Capability delta.** Nothing counts as a finding until it can be written as "Before this bug, an actor could do X. After exploiting it, an actor can do Y." If X and Y are the same, it's an observation, not a vulnerability.
- **Adjacent defense check.** For every candidate, I asked whether the team defended the neighbouring case. If they did, the gap is usually deliberate or covered elsewhere. If they didn't, the gap usually goes deeper than the first candidate suggested.

## Defense Catalog

*Patterns worth studying for anyone building prediction markets or vault-based custody systems.*

Every killed hypothesis was killed by something specific. Writing those down produces a reusable checklist: for each attack class, the defense that held here, and the attack template that applies to any target without it.

### 1. Reentrancy

**Defense:**
- `nonReentrant` on every vault and adapter entry point that moves value: split, merge, convert, redeem, and the emergency withdrawals.
- A transient-storage flag gates ERC1155 acceptance. The vault accepts inbound ERC1155 transfers only inside its own split and convert flows, and the EVM clears the flag automatically at the end of the transaction.
- `onERC1155Received` is a pure acceptance gate. It returns the selector and never touches the ledger. All ledger changes happen in the vault's own internal code paths.

**Attack template, on a target without these:**
- Balance-diff patterns (`balanceAfter - balanceBefore`) let an attacker re-enter between the snapshot and the read.
- ERC1155 `onReceived` callbacks that update ledger state can be driven by a crafted token contract.
- Adapter or wrapper contracts that call external tokens in the middle of a state update are re-entry points even without a `receive()` hook.

### 2. Oracle Manipulation

**Defense:**
- **The conditionId includes `msg.sender`.** CT derives `conditionId = keccak256(oracle, questionId, outcomeSlotCount)`, and `reportPayouts` rebuilds it from `msg.sender`. Only the address baked in when the condition was prepared can resolve it. Binary conditions are bound to the oracle proxy and neg-risk conditions to the adapter.
- **Two-phase propose → challenge → finalize**, with a bounded challenge window during which anyone can post a bond to dispute.
- **Pull-payment bonds.** Bond refunds and rewards go to a pull-payment ledger rather than being sent directly, so a challenger whose address becomes USDC-blacklisted can't block resolution.
- **Observation period on parameters.** Changes to the bond, window, or reward need a propose step and a 24h wait.
- **Upgrade timelock.** UUPS upgrades need a 48h request and must then execute within a 7-day window.
- **Bond snapshot.** The bond amount is fixed when the result is proposed, so it can't be re-priced for challenges already in flight.

**Attack template, on a target without these:**
- If `msg.sender` isn't part of the condition identity, someone other than the intended oracle can resolve it.
- Single-phase resolution, where proposing is finalizing, turns a compromised oracle key into instant theft.
- Pushing bond refunds directly lets a blacklisted recipient block resolution.
- Oracle parameters that change without an observation period can be front-run: raise the bond to price out challengers, then resolve.

### 3. Accounting Inflation

**Defense:**
- **The ledger is authoritative.** Per-vault ERC20 and ERC1155 ledgers decide every outflow. The real `balanceOf` is read only for emergency drains and sweeping off-ledger tokens.
- **Only internal paths change the ledger.** Exchange inflow and outflow hooks are restricted to registered exchanges, and split, merge, and convert update the ledger through the vault's own library calls.
- **The balance-diff path runs under `nonReentrant`**, and the collateral is a token with no transfer hooks.
- **Per-id clamp on redeem.** `ledger[id] = min(ledger[id], balanceOf)` prevents over-crediting.
- **The ledger is zeroed before the external redeem call.** If the CT call reverts, the whole transaction reverts and no partial ledger state remains.

**Attack template, on a target without these:**
- Vaults that use `balanceOf` for outflow decisions can be inflated with donations.
- Ledgers that external callbacks can modify are injection points.
- Unguarded balance-diff patterns can be exploited with callback-bearing or fee-on-transfer tokens.
- Redeem paths that credit the ledger after the external call leave a window open.

### 4. Privilege Escalation

**Defense:**
- **Two signatures on every value-moving operation.** Withdraw, split, merge, and convert each need both the owner's and the backend's EIP-712 signature, so a single compromised key can't move funds.
- **Vault bytecode pinned with SSTORE2.** The factory stores the vault creation code at deploy time, and no admin path can swap the implementation. Migrating means deploying a new factory.
- **Fixed spender set on immutable contracts.** The vault approves a fixed set of spenders at construction, and every one of them is non-upgradeable.
- **Digest-based replay protection.** Used digests are tracked, and the owner or the backend can revoke a digest before it's used.
- **Operator-only order lifecycle.** Users have no on-chain path to submit or cancel orders.

**Attack template, on a target without these:**
- A single-signature vault lets one compromised backend key drain every user.
- An upgradeable vault implementation lets a compromised admin swap in draining logic.
- An `approve` function on a custody contract lets a compromised key add any spender.
- Signatures without nonce or digest tracking can be replayed.

### 5. Emergency / Migration Abuse

**Defense:**
- **`isEmergencyActive()` stops new settlements straight away.** The exchange rejects orders from a maker vault in emergency, both during the countdown and during the execution window.
- **7-day timelock plus a bounded 7-day drain window.** The window can't stay open indefinitely.
- **The backend can't cancel an emergency.** It has no way to reset the timer and hold a vault hostage.
- **Freeze on drain.** Every emergency drain also freezes the user in the deposit-limit registry.
- **Drains read `balanceOf`, not the ledger**, so off-ledger tokens leave too, and the ledger is zeroed at the same time.

**Attack template, on a target without these:**
- An emergency drain that doesn't block settlement can race in-flight orders.
- An unbounded emergency window lets a compromised key hold a vault hostage.
- If the backend can cancel an emergency, it can keep resetting the timer and block withdrawal forever.
- An emergency with no deposit freeze allows drain → re-deposit → drain loops.

### 6. Cross-Market Contamination

**Defense:**
- **Wrapped collateral is isolated per market.** Each neg-risk market gets its own EIP-1167 wrapped-collateral clone, and unwrapping can only release collateral held by that clone.
- **positionIds are unique by construction.** `collectionId` is a bn128 curve point derived from `keccak256(conditionId, indexSet)`, and `positionId = keccak256(collateral, collectionId)`. A collision would mean breaking keccak256 or the curve.
- **Domain-separated EIP-712.** Each exchange's immutable domain separator includes its own address and chain ID, so a signature for one exchange can't be replayed on another.
- **Token registry validation.** Every traded token must be registered on the exchange that settles it.

**Attack template, on a target without these:**
- A collateral pool shared across markets lets one market's accounting error drain another market's reserves.
- Sequential or user-chosen token IDs make cross-market signature replay possible.
- Signed orders without domain separation can be replayed across chains or contracts.

### 7. Resolution Manipulation

**Defense:**
- **Neg-risk markets resolve atomically, all or nothing.** The adapter writes `determined = true` before any CT payout call, then resolves every question in the same transaction. No partially resolved state ever exists.
- **`hasConversions` blocks voiding after a convert.** A sticky flag is set on the first conversion, which stops a void's equal-split payout from over-redeeming against backing the convert already released.
- **Two-phase void.** A void has to be queued before it executes, and while it's queued, both convert and resolution are blocked, which closes the front-running window.
- **Deterministic burn sink.** Burned NO tokens go to an address nobody holds the key for, so they can't be recovered.
- **Convert lifecycle gates.** Converting requires the market to be not determined, not voided, not queued for void, and not paused.
- **Resolution happens once.** CT refuses to resolve a condition a second time.

**Attack template, on a target without these:**
- Partial resolution of a multi-outcome market lets someone convert worthless positions for credit.
- Allowing a void after conversions lets the void payout over-redeem.
- A single-step void can be front-run with a convert that pulls out unbacked collateral.
- A burn address someone holds the key for lets burned tokens come back.

### 8. Token Assumption Rigidity

**Defense:**
- The collateral is set at deploy time and is immutable on the vault, the adapter, and every wrapped-collateral clone. No admin path can swap it.
- `SafeERC20` is used for every transfer.

**Attack template, on a target without these:**
- If an admin can swap the collateral for a fee-on-transfer token, every balance-diff and wrap pattern breaks.
- Rebasing collateral breaks ledger-authoritative designs, because `balanceOf` drifts away from the ledger.
- ERC777-style hooks allow reentrancy even through a plain `transfer`.

### Portable Checks for Every Target

Two more attack classes don't come from a defense on this codebase. They're checks I now run on every target:

- **Governance lockout.** Check every `removeAdmin`, `renounceRole`, and `revokeRole` path for a last-holder guard. On a non-upgradeable contract, losing the last admin can't be undone.
- **Fee extraction.** For every contract that collects fees, find the way to withdraw them: `withdrawFees`, `claimFees`, a rescue function, or an admin transfer. If fees can come in but never go out, the next question is whether the contract can be upgraded.
- **Chain them.** If the admin role can be bricked and fee withdrawal is admin-gated, the two together become a permanent loss of value, even though neither is serious on its own.

## Hypothesis Examples

Three killed hypotheses, picked to show the reasoning. Each one was disproven, and each still leaves behind an attack template for the next target.

### H-15: Convert after partial resolution

**Hypothesis.** In a neg-risk market, convert burns NO tokens across several questions and releases collateral. If some of those questions were already resolved at the CT level, their NO tokens might be worthless while convert still credits them at full value.

**Intuition.** Multi-outcome markets are made of separate binary conditions. If they can resolve one at a time, there's a window where the adapter's view ("not yet determined") and CT's view ("some questions already paid out") disagree, and convert relies on the adapter's view.

**Kill.** Partial resolution can't happen, for two separate reasons:
1. CT derives the conditionId from `msg.sender` at resolution time. Neg-risk conditions are prepared by the adapter, so only the adapter can resolve them. Neither the oracle nor anyone else can resolve a single question directly on CT, because the hash wouldn't match.
2. The adapter's `reportOutcome` writes `determined = true` before any CT call, then resolves every question in one transaction. Convert checks `determined`, and `nonReentrant` stops convert from interleaving with resolution.

**Template for the next target.** On any multi-outcome market built from binary components, ask who can resolve each component and whether resolution is atomic across all of them. If either answer is "anyone" or "not atomic", convert-style operations can price against stale state.

### H-19: Overlapping indexSets double-count redemption

**Hypothesis.** `redeemPositions` takes an array of indexSets and adds up a payout for each. Passing the same indexSet twice, or ones that overlap, might count the same stake more than once.

**Intuition.** Loops over user-supplied arrays that accumulate value are a classic double-count shape. Nothing in the function signature stops duplicates.

**Kill.** The loop doesn't need to reject duplicates, because the token model makes them harmless:
1. Each indexSet maps to a unique ERC1155 positionId through the bn128-based collectionId derivation. Different indexSets mean different tokens.
2. Each iteration reads the caller's full balance of that positionId and `_burn`s all of it. The second time a duplicate comes up, the balance is zero and it adds nothing.
3. A combined indexSet (for example `0b11`) is a separate position. It's never minted by the standard binary split, and if someone does hold it, it correctly redeems at the sum of its outcomes' payouts.

**Template for the next target.** For any loop that accumulates value over a user-supplied array, check whether each element consumes its own backing (burn, zero, or mark as spent) before the next element is processed. If the backing is only read, not consumed, duplicates count twice.

### H-08: Emergency drain races in-flight settlements

**Hypothesis.** A user starts an emergency withdrawal while orders involving their vault are still in the operator's pipeline. If those orders settle during the countdown, the vault's ledger changes underneath a drain that's already scheduled, and the counterparty might lose out.

**Intuition.** Emergency paths are rarely exercised, and they usually check state when the emergency starts rather than when each later action happens. Anything already in flight is the natural race.

**Kill.** The check is made at match time, not at initiation time. The exchange's `_validateOrder` calls `isEmergencyActive()` on the maker vault for every fill, and that returns true from the moment the emergency starts, through both the countdown and the drain window. An order validated earlier is checked again when it's filled, and the fill reverts. A settlement that lands in the same block but before initiation is simply a settlement that happened first. The funds belong to the vault, and the drain, which reads `balanceOf`, takes them out correctly. Settlement transfers and ledger hooks happen atomically in one transaction, so no counterparty is left half-settled.

**Template for the next target.** For every emergency or pause mechanism, find where it's enforced. If it's checked only when something is initiated or queued, anything already queued can still settle. The check has to happen at the point of execution.

## Engagement Summary

- **23 hypotheses** tested across **3 passes** on **~3,603 nSLOC**
- 63-invariant ledger, 14 leads, and an 8-class defense catalog plus portable checks, all reusable on future targets

No high-impact findings on a well-defended codebase is a finding in itself: it produces a defense catalog that compounds across every future engagement.

---

Engagement completed. Details covered by HackenProof disclosure policy.
