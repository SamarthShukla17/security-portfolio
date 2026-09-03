---
title: "How I Audit — Method, Toolkit, and What I've Worked On"
date: "2026-09-03"
protocol: "Cross-Protocol"
severity: "N/A"
status: "Methodology"
summary: "The method, the toolkit, and a category-level summary of engagement work: full security reviews across Solana/Rust DeFi (AMM, staking, lending, perps, oracle-aggregator), Substrate cross-chain bridges, EVM stablecoin/account-abstraction, and NEAR/Wasm contracts — roughly seven protocols, multi-firm-audited targets, one independently-confirmed critical-severity bridge issue."
---

## Where I Am, Honestly

I'm early in this — an independent researcher, not a senior auditor with a firm behind me. I don't have years of engagements to point to. What I do have is a method I've applied consistently across enough real, audited targets to know it holds up, and a track record of negatives I can actually defend rather than just claim. This page is about the method, because on a short track record, *how I think* is the more honest credential than a badge count.

## The Method

Every target goes through the same six steps, in order, regardless of chain or language:

1. **Scope-gate.** Confirm the exact program IDs / repos / commit are actually in scope before reading a single line for bugs. Note the in-scope impact buckets and the out-of-scope exclusions up front. Refusing to analyze out-of-scope code isn't caution for its own sake — a finding outside scope is a finding that doesn't get paid or read, and it wastes the time that should go to the real surface.
2. **Map.** Every external/public entry point, every state variable, every fund-movement path, every trust boundary (who is allowed to do what), every cross-program/cross-contract call and whether its target is pinned or attacker-supplied.
3. **Pull the audit history.** Every prior audit report, every finding and its remediation. The payable bug most often lives in the seam the audits didn't cover — post-audit modules, incomplete or regressed remediations, cross-repo or cross-chain consistency that no single-repo audit was ever structured to check. Audit *count* is the real signal here, not program age or size — a bounty target is audited before it's listed, almost by definition.
4. **State the invariants.** As falsifiable sentences, not vibes: value conservation (no one ends with more than they put in), no unbacked mint, authority integrity, no permanent lock reachable by an unprivileged actor. List which instructions could threaten each one.
5. **Attack each invariant** using six machine-unauditable bug classes as a coverage check — not a substitute for the protocol's own invariants, but a way to make sure I've actually considered each shape rather than pattern-matching on whatever's easiest to spot:
   - Price manipulation — any price/rate a live path trusts as truth, movable in-transaction.
   - ID / access violation — PDA substitution, wrong-account, seed collision, identity confusion (maker vs. taker, owner vs. signer).
   - Erroneous state update — stale state after a transition, a value read from the wrong source, an attacker-controlled field treated as trusted.
   - Atomicity violation — two value-moving operations composed in one transaction to cross a price or accounting boundary; missing per-block/cooldown/rate limits.
   - Privilege escalation — an unprivileged actor reaching a privileged role via a lifecycle, re-init, or close path.
   - Erroneous accounting — a mint/fee/balance computation that fails to conserve value across a sequence; rounding that quietly accrues to the caller.

   Six bug classes alone tell you *what* to look for. They don't tell you *how* to look — that's a separate axis I run every candidate through: is this a state-machine/sequencing question, a cross-subsystem interaction, a way to weaponize a function against a third party, an extreme-value/boundary case, a permanent-lock question worked backward from impact, a trust-edge assumption nobody re-checked, or something a griefer would do with no profit motive at all. Six patterns and seven angles, crossed against every candidate, is the actual grid — not a fixed checklist of known bug names.
6. **Falsify before deepening.** For every candidate, find the single cheapest test that would prove it *wrong*, and run that first. Most candidates die right here — which is the point. It's what keeps the false-positive rate down and makes a reported negative something a reader can actually trust rather than "we looked and didn't feel like digging further."
7. **PoC or it's a note, not a finding.** No submission goes out on a description of a bug; it goes out on a bug that ran. On PoC-required programs, "can I actually PoC this" is part of triage, not a step for later. And nothing goes out that I can't personally explain unaided — tooling does extraction and navigation; scope calls, exploitability, severity, and duplicate judgment stay mine.

## The Toolkit

- **Scope-gated inventory harness** — checks a file against the exact in-scope program IDs/repos before anything else runs against it, and refuses out-of-scope input. Mechanical account/call/arithmetic extraction; judgment stays with me.
- **A standalone invariant/fuzz harness**, built outside the target's own build workspace — hand-declaring instruction and account layouts from the committed interface definition rather than importing the target's own (sometimes broken) dependency tree, so a stale or conflicting transitive dependency never blocks a run. State N invariants, run a randomized loop, corroborate what the manual trace already found.
- **An LSP-driven call-hierarchy navigation tool**, talking directly to a language server over its own protocol — find / references / callers / callees (recursive, to a configurable depth) / signature lookup, with the ability to jump straight to a `file:line:char` when a name is ambiguous. This answers "are these two functions actually connected" with certainty instead of grep's false confidence in either direction. Semantic navigation, not dataflow or taint analysis — it tells you what calls what, not what's guaranteed to flow where.
- **A second-model sanity pass** on key reasoning before it reaches a report, specifically to catch confident-but-wrong conclusions before they get written down as fact. Every AI-assisted claim gets checked against the actual source before it's trusted — that discipline exists because of a real fabricated-citation incident earlier on, and it's non-negotiable now.

## What I've Actually Worked On

Full security reviews across **Solana/Rust DeFi** — AMM, staking, lending, perps, and an oracle-aggregator layer — **Substrate-based cross-chain bridges**, **EVM stablecoin and account-abstraction infrastructure**, and **NEAR/Wasm contracts**. Roughly seven protocols in total, all multi-firm-audited targets before I ever touched them — meaning the easy bugs were already gone, and whatever surface remained was exactly the seam the method above is built to find.

One engagement produced an independently-confirmed critical-severity finding in a cross-chain bridge's consensus-verification path — live-chain-confirmed, reproduced with a runnable proof of concept, and validated as an independent finding by the program rather than dismissed as a known issue. The rest of that batch closed as reasoned negatives: hypotheses formed, dynamically tested against real or faithfully-extracted source, and traced to an existing, correctly-functioning guard rather than left as an unverified assumption.

I'm not naming specific protocols or describing specific bug mechanics here — most of this work sits under active bug-bounty program terms, and disclosure discipline doesn't get suspended just because a page is a portfolio piece instead of a report. The [writeups on this site](/writeups) are the targets where full technical detail is actually clear to publish.

## Why This Is the Credential, Not the Résumé

Anyone can list protocol names and a severity count. What I can actually stand behind is the process: a scope-gate that refuses to waste effort outside the lines, invariants stated as falsifiable sentences instead of impressions, a falsification-first discipline that kills most candidates before they cost real time, and nothing submitted that I can't explain myself, unaided, start to finish. On a short track record, that's the part worth reading closely — it's also the part that doesn't get shorter as the track record grows.
