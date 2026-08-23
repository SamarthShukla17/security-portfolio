---
title: "Orca Whirlpools — Pinocchio Fast-Path Trace"
date: "2026-08-23"
protocol: "Orca Whirlpools"
severity: "N/A"
status: "Negative (Clean Audit)"
summary: "Full trace of Whirlpools' unaudited-by-date pinocchio fast-path liquidity instructions (post-cutoff commits bypassing Anchor's derive-macro validation) via a standalone LiteSVM harness. No exploitable gap found."
---

## Scope & Methodology

Confirmed the repository's `main` HEAD matched the deployed `0.9.0` tag
before starting, to avoid tracing against stale source. Diffed all
instruction files against the commit marking the last completed
third-party audit and identified roughly ten instruction files changed
since that cutoff — the surface this trace focuses on, since it's the
part of the codebase no external audit has actually looked at yet.
Several of the affected instructions are hand-rolled `AccountIterator`-based
liquidity handlers written against the pinocchio runtime rather than
Anchor, meaning they don't benefit from Anchor's derive-macro account
validation and have to be checked by hand, account by account.

## What Was Tested

- Token account CPI transfers, confirming every transfer path pins its
  token program account to the validated SPL Token or Token-2022 program
  ID rather than trusting a caller-supplied program account.
- `pino_verify_position_authority`, tracing its raw on-chain owner/delegate
  field checks by hand (no Anchor `has_one`/`constraint` macros to lean
  on) — specifically the `delegated_amount` bounds check and the signer
  check gating delegated-authority use.
- Tick-array aliasing in `reposition_liquidity_v2` — whether a caller
  could supply overlapping or aliased tick-array accounts to make the
  instruction read and write inconsistent state within a single call.
- An exhaustive tick-math monotonicity check across the instruction's
  tick-index arithmetic, to catch any boundary case where crossing a
  tick could move price non-monotonically.

## Result

Closed negative. No exploitable path was found across the identified
unaudited surface — the hand-rolled pinocchio account validation in
these instructions holds up to the same standard as the audited
Anchor-based code paths elsewhere in the program.

## Why This Matters

Most audits are scoped to a snapshot in time, but long-lived protocols
keep shipping after that snapshot closes. Diffing against the audit's
cutoff commit and tracing exactly what changed since is a repeatable way
to triage that "unaudited by date" surface directly, instead of
re-running the same checklist against code that's already been reviewed.
That's the value of this trace: not a claim that Whirlpools is now fully
audited, but that this specific, identifiable slice of post-cutoff
surface has been checked and can be crossed off.
