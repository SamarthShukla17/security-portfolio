---
title: "Drift Protocol / Velocity DEX — Investigation Notes (Paused, Unverified)"
date: "2026-08-31"
protocol: "Drift Protocol (Velocity DEX)"
severity: "TBD"
status: "Paused (Unverified)"
summary: "Two lines of investigation, both paused and unverified: a liquidation-timing hypothesis initially assessed High severity, later provisionally set aside after the protocol's own documentation appeared to describe it as intended design; and a self-trade guard question that appeared covered but whose reachability was not re-verified. Neither conclusion has had a fresh verification pass."
---

> **Status note (2026-10-01):** This investigation is paused and its conclusions are **unverified**.
> An earlier version of this page labelled it a clean audit / retracted finding. That was premature:
> neither line of investigation has been re-verified, the liquidation-timing result has not been
> confirmed either as intended behavior or as a real issue, and it may be affected by how the
> reproduction was built. The on-chain observations in §3 reflect a single point in time and may be
> out of date. Treat this page as working notes, not a verdict.

**Target:** Drift Protocol v2, rebranded Velocity DEX.

**Scope of this writeup:** two lines of investigation on the same codebase — a margin-liquidation timing hypothesis, and a trace of a self-trade guard. Both are paused. Mechanism-level detail has been deliberately omitted.

---

## 1. Summary

Two investigations, presented together because they illustrate the same discipline from opposite directions: stating a conclusion only as strongly as the checks behind it.

1. A liquidation-timing hypothesis was reproduced in a local test, initially assessed as potentially High severity, then **provisionally set aside, unverified** after the protocol's own documentation appeared to describe the relevant behavior as intended. That reading of the documentation has not been independently confirmed, and the reproduction has not been re-run against an unmodified target.
2. A question about whether one instruction carries an explicit guard against a trader matching against itself was traced via call-hierarchy analysis. The trace appeared to show an existing guard covers the path. The instruction's reachability was also checked once and appeared limited at the time. **Neither result has been re-verified**, and the on-chain state may have changed.

---

## 2. Liquidation timing: provisionally set aside — unverified

### 2.1 The observed behavior

A local reproduction suggested a candidate way for a position to avoid liquidation depending on how account health is evaluated against the oracle price. The initial framing treated this as a potential evasion mechanism and assessed it at High severity.

The reproduction was built against a locally adjusted copy of the target code rather than an unmodified build, so the result may reflect the test setup rather than production behavior. This has not been ruled out.

### 2.2 The provisional set-aside

Before any submission, the target's own documentation was checked rather than relying on the plausibility of the initial hypothesis. The documentation appears to describe the relevant behavior as a deliberate design trade-off.

Two further checks were run:

- **Attacker-controlled trigger?** Apparently not — the triggering condition looked like ordinary market movement rather than something a trader could induce on demand. Every finding that survives to submission has to answer "who can trigger this, against whom."
- **Audit cross-reference.** The target's published audits were checked. They show prior attention to the same general area, without any of them clearly flagging this behavior as a defect.

**Conclusion: provisionally set aside, unverified.** This is not a confirmed negative and not a confirmed finding. It is kept as a documented working note with the reasoning behind why it was paused.

---

## 3. Self-trade guard trace: paused

### 3.1 The candidate

A systematic, instruction-by-instruction security checklist pass flagged that one order-placement instruction has no *explicit*, instruction-level check that the two counterparties differ, unlike other paired-account instructions in the codebase. It was flagged as low-confidence pending a deeper trace.

### 3.2 The trace

A call-hierarchy trace (using a language server directly rather than text search) appeared to show that a general guard in the order-matching logic is reachable from this instruction. A residual question about the granularity of that guard was noted and not pursued.

### 3.3 The reachability check

Before going deeper, the cheapest falsification was run first: whether the instruction is callable in the current build. At the time of checking, source inspection and a single on-chain check both suggested the program's trading instructions were unavailable. That observation has **not been re-verified**, and the current state is unknown.

**Conclusion: paused, unverified.** The question was not resolved either way.

---

## 4. What this demonstrates

- **Labeling conclusions at their actual strength.** A result that was walked back after reading one document is recorded as provisional, not as a verdict, until it has been independently re-checked.
- **Semantic call-graph analysis, not text search.** Confirming that two distant functions are actually connected is the kind of question grep gives false confidence about in either direction.
- **Reachability-first triage.** Checking the cheapest possible disproof before the expensive one is a discipline, not a shortcut — provided the check is refreshed before it is relied on.
- **Live-chain checks are point-in-time.** An on-chain observation is evidence about one moment, not a standing fact.
