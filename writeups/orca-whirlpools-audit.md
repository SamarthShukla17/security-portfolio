---
title: "Orca Whirlpools — Pinocchio Fast-Path Trace"
date: "2026-08-23"
protocol: "Orca Whirlpools"
severity: "N/A"
status: "Negative (Clean Audit)"
summary: "Full trace of Whirlpools' unaudited-by-date pinocchio fast-path liquidity instructions (post-cutoff commits bypassing Anchor's derive-macro validation) via a standalone LiteSVM harness. No exploitable gap found."
---

## Scope

Before touching anything I confirmed `main` HEAD matched the deployed `0.9.0` tag — tracing against stale source is a waste of a session, and I've been burned by it before. From there I diffed every instruction file against the commit the last completed third-party audit was scoped to. About ten instruction files had changed since that cutoff. That diff is the actual scope of this trace: not "audit Whirlpools," which is a multi-week engagement, but "check exactly the surface that shipped after the last set of eyes left."

A chunk of those ten are hand-rolled `AccountIterator`-based liquidity handlers written against the pinocchio runtime instead of Anchor. That detail is what made the diff worth tracing rather than skimming: pinocchio code doesn't get Anchor's `#[derive(Accounts)]` — no `has_one`, no `constraint`, no compiler-enforced owner/signer checks. Every account relationship these instructions rely on has to be verified by hand, in the instruction body, the way you'd read raw Solana program code from 2021.

## What I Actually Checked

**Token program pinning on every CPI transfer path.** The generic version of this bug is a caller supplying their own program account in place of the real SPL Token / Token-2022 program ID, then routing a transfer through it. I went through each transfer path in the fast-path instructions and checked whether the token program account gets pinned against the validated program ID or just trusted as-given. All of them pin correctly.

**`pino_verify_position_authority`, by hand.** No `has_one` to lean on, so I traced the raw owner/delegate field reads directly. Two things mattered here: the `delegated_amount` bounds check (does a delegate's authorized transfer amount actually get enforced, or can it be exceeded), and the signer check gating delegated-authority use in the first place. Both held.

**Tick-array aliasing in `reposition_liquidity_v2`.** This was the one I expected to find something in. The instruction takes multiple tick-array accounts, and if a caller can pass the same underlying account twice under two different account roles (e.g. as both `existing_tick_array_lower` and `new_tick_array_upper`), the instruction can read stale state in one branch and write through the alias in another — classic double-account-role confusion. I built a LiteSVM test that deliberately aliases those two account slots and ran the full reposition flow against it. The instruction's tick-array bookkeeping (bitmap `popcount` and array `data_len` updates) stayed internally consistent across the aliased call. No corruption.

**Tick-math monotonicity.** Separate from account-level bugs, I wanted to rule out an arithmetic boundary case: does crossing a tick during a swap or reposition ever move price non-monotonically, which would open a manipulation window independent of any account check. I wrote a standalone pass walking the tick-index arithmetic across the instruction's valid range looking for a break in monotonicity. Didn't find one.

## Result

Closed negative. Nothing above turned into a finding. The hand-rolled pinocchio validation in this batch of instructions holds up to the same bar as the audited Anchor code sitting next to it in the same program — which isn't guaranteed just because a team is competent; Anchor's macros exist precisely because this class of check is easy to get subtly wrong by hand, and it's worth confirming rather than assuming.

## Why Bother Tracing a Clean Result

Audits are scoped to a commit. Protocols don't stop shipping the day the audit report is signed. The unaudited-by-date surface on a live protocol is real risk that doesn't show up in any published report, and it just sits there until someone traces the diff. That's what this was — not a claim that Whirlpools is now "fully audited," which isn't a real state a live codebase can be in, but a specific, dated, checked-off answer to "is the pinocchio fast-path shipped since the last audit safe." As of this trace, yes.
