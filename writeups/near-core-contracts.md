---
title: "NEAR Core-Contracts — DAO Infrastructure Review in Rust/Wasm"
date: "2026-10-08"
protocol: "NEAR Core-Contracts"
severity: "N/A"
status: "Engagement"
chain: "NEAR · Rust/Wasm"
scope: "6 contract families"
highlights:
  - "5 review passes"
  - "6,000 fuzz cases"
  - "1,908-DAO on-chain scan"
  - "14 sandbox PoCs"
summary: "HackenProof bug bounty engagement on NEAR's core ecosystem contracts: lockup, staking, multisig, and DAO governance. Five passes of increasing depth, a NEAR-specific checklist, fuzzing on the math-heavy modules, sandbox PoCs on a fresh clone, and a custom RPC scanner that checked hypotheses against every readable live DAO."
---

**Platform:** HackenProof Bug Bounty

**Protocol:** NEAR core-contracts, the DAO and account infrastructure much of the NEAR ecosystem runs on

**Language:** Rust, compiled to NEAR Wasm

**Scope:** 6 contract families covering lockup, staking pool, multisig, and DAO governance

---

## Why NEAR Needs Its Own Checklist

NEAR's execution model differs from Solana's and from EVM's in ways that matter for security. Cross-contract calls are asynchronous. A call returns a promise, the callee runs in a later block, and the caller only learns the result in a separate callback. State the caller changed before the call is already committed by the time that callback runs, whether the call succeeded or not. Storage is paid for with staked balance. Access keys add a second permission layer on top of contract-level access control.

Before the first pass I wrote a NEAR-specific checklist and ran it against every contract family:

- **Cross-contract calls:** what state is committed before the promise goes out, and whether it's correct if the promise fails
- **Promise chains and callbacks:** whether every callback is `#[private]`, whether it handles every result branch, and whether it can be reached out of order
- **Storage staking:** who pays for storage growth, and whether an outsider can force someone else to pay it or exhaust it
- **Access control:** owner and role checks, `predecessor_account_id` vs `signer_account_id`, and full-access vs function-call keys

## Five Passes, Increasing Depth

The first pass was a broad map of entry points, trust boundaries, and fund-moving paths across all six families. Each later pass went narrower and deeper: checklist-driven review, then invariant-focused work on the accounting, then cross-contract interaction across families, and finally a verification pass that tried to break every surviving hypothesis before it was allowed to count.

## Fuzzing the Math

The staking and lockup modules do the heaviest arithmetic: share and unit conversions, vesting schedules, and time-based release. These got 6,000 fuzz cases. The targets were rounding direction, overflow at the edges, and conservation across deposit and withdraw sequences. Fuzzing here confirms or rules out what the manual pass suspected. It doesn't replace that pass.

## Sandbox PoCs on a Fresh Clone

Every hypothesis that survived manual review got a working PoC in the NEAR sandbox, 14 in total. Each one was rebuilt and rerun from a fresh clone, not from my working tree, so that nothing could depend on a local patch, a stale build, or leftover state. Something counts as verified only if a clean checkout reproduces it.

## Checking Hypotheses Against the Live Chain

A code path being reachable in a sandbox doesn't tell you whether any real deployment is in that state. I wrote a custom Python RPC scanner that enumerated 1,908 live on-chain DAOs and read their on-chain state directly. That let me test each hypothesis against the network as it actually is, instead of guessing how common a given configuration might be.

Public RPC endpoints rate-limit hard, so the scanner needed backoff and resumable checkpoints to finish a full sweep.

## Confirming What's Actually Deployed

Before testing anything against production, I needed to know exactly which contract version is deployed. I didn't rely on the repository's labels or the documentation for that. I confirmed the deployed version independently by reading the on-chain contract reference and reproducing the build so the Wasm matched byte for byte. Every later claim was tested against the exact code users interact with.

---

Engagement completed. Details covered by HackenProof disclosure policy.
