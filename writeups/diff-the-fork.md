---
title: "Diff-the-Fork: Auditing a Blockchain Client When Only Your Deviations Matter"
date: "2026-10-22"
protocol: "Cross-Protocol"
severity: "N/A"
status: "Methodology"
summary: "A note on auditing forked infrastructure clients, where upstream bugs are explicitly out of scope and the real attack surface is the delta."
---

Most audit methodology assumes you're reading a codebase cold: map entry points, state invariants, trust boundaries, then try to break them. That approach breaks down the moment you're looking at a fork of something upstream security researchers have already hammered on for years — a consensus client built on a well-known BFT engine, an execution client built on a popular modular framework. Reviewing the whole thing as if it were novel wastes effort on code that isn't yours to find bugs in, and most bounty programs say so explicitly: only fork-specific deviations are in scope.

This reframes the task entirely. The question isn't "what's wrong with this code" — it's "what did this team change, and did the change preserve every invariant the upstream code was relying on."

## Where Deviations Hide

Three places, in order of how often they actually matter:

1. **The obvious diff.** A commit message, a renamed function, a config field that doesn't exist upstream. Easy to find, often already covered by whatever audits the project has already paid for.
2. **The silent structural change.** A field gets dropped — say, a sticky boolean that distinguished two states upstream kept separate — and every place that used to branch on three states now branches on two. Nothing in the diff itself looks alarming; the alarm is in what's missing. This is the hardest class to find by reading the new code alone, and the only reliable way in is diffing directly against the specific upstream commit the fork branched from, then tracing every caller of the removed thing.
3. **The adaptation that works on average but not at the boundary.** A rate limit copied from a sibling code path, a cap enforced on one message type but not its structural twin. These show up by asking "did the team defend the adjacent case?" — and if they did, and missed this one, that's not speculation, it's evidence you can cite directly: here's their own fix for the lookalike problem, here's the lookalike problem they didn't fix.

## Map What's Been Audited First

An audited-vs-unaudited map is worth building before any hunting starts. A codebase with a long audit history usually has that history concentrated on a handful of modules — the ones that moved money, or that the team flagged as risky at the time. The newest integration boundary between two forked subsystems (where client A hands something to client B across a process boundary) is frequently the one piece nobody's third-party review ever touched, simply because it was the most recently added and the audits were scoped before it existed. Reading the scope-limitations section of every prior report — not just the findings — tells you exactly where that boundary is.

## The Diff Is Where to Look, Not What to Report

None of this replaces verification. A diff-derived hypothesis is still a hypothesis until it reproduces on a fresh clone, with a concrete, measured cost or outcome — not an estimate. "This allocates more than it should" is not a finding; "baseline X, forged input ~6x the time and ~7x the memory, same wire budget, zero additional cost to the sender" is. The diff tells you where to look. The number is what makes it real.
