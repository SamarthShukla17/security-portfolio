---
title: "Zest Protocol — Clarity Lending Review on Stacks"
date: "2026-10-15"
protocol: "Zest Protocol"
severity: "N/A"
status: "Engagement"
chain: "Stacks · Clarity"
scope: "8 contracts"
highlights:
  - "4 review passes"
  - "Clarinet simnet, 128 tests"
  - "150-run invariant campaign"
summary: "HackenProof bug bounty engagement on Zest, a Bitcoin lending protocol on Stacks. My first target outside Solana and EVM: four independent review passes over eight Clarity contracts, a Clarinet simnet harness, a mutant-validated invariant campaign, and live-state checks against mainnet."
---

**Platform:** HackenProof Bug Bounty

**Protocol:** Zest, a Bitcoin lending protocol on the Stacks blockchain

**Language:** Clarity

**Scope:** 8 smart contracts covering vaults, DAO governance, registry, and the trait interfaces that tie them together

---

## Why This One Is Different

Everything I'd audited before this was Rust on Solana or Solidity on EVM. Clarity is neither. It's interpreted rather than compiled, deliberately not Turing-complete, and has no reentrancy in the usual sense. Contracts talk to each other through traits that are resolved at call time. Most of the bug shapes I usually start from either don't exist here or show up in a different form.

So the first job wasn't hunting. It was working out which parts of my method carry over to a new language and which have to be rebuilt.

## Adapting the Method

The core steps don't depend on the chain: scope-gate, map every entry point and trust boundary, state the invariants as falsifiable sentences, then attack each one. What changes is the checklist underneath. I wrote a Clarity-specific supplement before the first pass. It covers how trait arguments are validated against the registry, how `as-contract` changes the effective principal, how `tx-sender` and `contract-caller` differ as an authority check, how `unwrap!` and `try!` propagate failures, and what post-conditions do and don't guarantee about asset movement.

Writing that supplement up front is the part I'd keep for any new language. Without it, the first pass ends up as Solidity reasoning applied to code that doesn't behave like Solidity.

## Four Independent Passes

Each pass started from a fresh read of the in-scope contracts rather than from the previous pass's notes. That way an assumption made early couldn't carry silently into the later passes. The passes had different jobs: a full entry-point and trust-boundary map, an invariant-driven pass over vault accounting, a cross-contract pass on the governance and registry paths, and a final fresh full read testing a new set of hypotheses.

## Simnet Harness

Everything ran in a local Clarinet simnet built around the real deployment: 53 contracts compiling cleanly and 128 tests passing. Hypotheses were tested by running them, not settled by reading.

## Invariant Campaign, and Proving It Isn't Vacuous

The vault accounting got a randomized invariant campaign of 150 runs over arbitrary sequences of user and admin actions. A campaign that passes proves nothing until you know it could have failed. So I seeded a deliberate mutant into the accounting and confirmed the campaign caught it. I also checked that the random sequences actually reached the states the invariants care about, instead of reverting early and passing trivially.

## Live-State Verification

Source tells you what a contract can do. On-chain state tells you what it's actually doing. I confirmed the pinned source matched what's deployed, then used read-only API calls to read live vault parameters and state. Every hypothesis was then judged against current mainnet conditions, not only against a simnet configuration I'd picked myself.

## What Carried Over

Languages and chains change. The method, the falsification-first habit, and the insistence on proving a test campaign isn't vacuous don't. Running this method on Clarity is the clearest evidence I have that it doesn't depend on any single ecosystem.

---

Engagement completed. Details covered by HackenProof disclosure policy.
