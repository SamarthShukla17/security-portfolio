---
title: "Hound: An Audit Harness Built Around Refutation"
date: "2026-11-13"
protocol: "Hound (open source)"
severity: "N/A"
status: "Methodology"
summary: "An open-source, model-agnostic multi-agent harness for smart-contract audits. Its design goal is not to find more candidates but to kill wrong ones: a citation gate, two independent judges, and execution-gated verification that only lets a finding stand if a compiled Foundry test demonstrates it."
---

**Source:** [github.com/SamarthShukla17/hound](https://github.com/SamarthShukla17/hound). Python 3.12, model-agnostic, built on OpenAI-compatible APIs via the `openai` SDK, with no agent framework.

## Why it exists

A language model reading Solidity produces plausible attack stories at an alarming rate, and most of them are wrong: the arithmetic is inverted, a check it calls missing sits on another line, or the "vulnerability" is an admin using an intended power. The expensive part of an audit is not generating candidates, it is killing the bad ones quickly and honestly. Hound is built around that second job.

## The pipeline

```
scope gate -> mapper -> hunters (one per lens x chunk x pass) -> dedup
  -> citation gate -> judge -> judge2 -> PoC scaffolds -> report
```

- **Scope gate.** Refuses to analyze code outside the declared scope before anything else runs.
- **Hunters.** One agent per attack lens, per chunk of code, per pass. The lenses are parsed out of knowledge-base files at runtime; no lens text is hard-coded in prompts or code, so the method lives in documents I can edit and review.
- **Citation gate.** A claim has to point at real lines that say what the claim says. This is aimed squarely at the "missing check that actually exists" failure.
- **Judge and judge2.** Two judges from **different model families, on purpose**. A second opinion from the same model family mostly repeats the first one's blind spots, so `judge2` only runs on candidates that already survived `judge`, which keeps the call count small.
- **Every finding carries an attacker-gain accounting.** Findings must state the value flow and the attacker's equity gain; the judge recomputes it, and the report warns when claimed severity outruns what the accounting supports. A bug that moves value for nobody is a griefing note, not a High.

## Execution-gated verification: Bloodhound

A judge is still an LLM opinion, and an opinion can be argued into or out of anything. The `bloodhound/` package never adds another opinion on top of a candidate. It tries to kill the candidate with a compiled, executed Foundry test, and a finding reads as confirmed only if it survives.

- **PoC forger.** Compiles each candidate's scaffold against the real target and repairs compile errors in bounded rounds. A candidate is marked `forged` only if the attack run demonstrates the bug **and** a control variant (the same test with the attack step removed) does not. That differential gate is what kills a tautological assertion that passes whether or not the bug exists.
- **Refutation panel.** Up to three reviewers answer a binary checklist against a forged PoC, each asked twice with the order of claim and code swapped; disagreement is discarded as unreliable. A "refuted" verdict has to name a `require()` or `vm.assume()` that gets injected into the real test and re-run, and it only counts if the attack actually stops passing.
- **Invariant engine.** Takes a **human-curated** claims file and generates a Foundry invariant handler per claim. Claims are never derived by the mapper; the code documents that mapper-derived claims measured worse. A counterexample is a lead, not a finding, and goes back through the forger.
- **Deep-fuzz escalation.** Opt-in. A claim that held under the fast gate can be escalated to a time-boxed Echidna or Medusa campaign. A clean result is still a clean negative, not a proof.
- **Dossier.** Renders the report skeleton with an honest confidence line and the PoC quoted verbatim. Sections with no underlying data are left as explicit TODOs, never filled in.

## Other modes

- **Upstream diff.** Detects a fork, fetches the real upstream source, diffs statement by statement with guards normalized, and has a model classify each deviation. On forked code the delta is the attack surface (see [Diff-the-Fork](/writeups/diff-the-fork)).
- **Config cross-check.** Evaluates every deploy-script value, joins it to the contract setter's checks, and lists parameters never set or mismatched between verify and deploy scripts.
- **Coverage gaps.** Ranks functions whose branches the team's own tests never exercise.
- **Chain check.** Pairs standing findings that share state and tests whether they combine into a profit.
- **Cost governance.** `--max-cost` stops a run when its running total crosses a budget, and every command writes a cost report into the run directory.

## What calibration looked like

On an early contest run, hound produced 23 candidate findings and the judge killed all 23. Zero survived. The failure analysis is public in the repo (`kb/CALIBRATION_NOTES.md`) and is the useful part: trusted-admin powers flagged as bugs (2), intended behavior misread as a bug (3), already-known issues (2), the hunter's own logic being wrong (8), scope exclusions (2), a claimed missing check that exists (4), and attack sequences that cannot execute (2). Each category became a prompt or gate change, for example forcing hunters to show the concrete numbers before the narrative, and treating an admin-gated function as a trusted caller unless it breaks a documented invariant even when used correctly.

## Limits, stated plainly

- **Cloud-only.** There is no offline mode. A local model small enough to run on a 16 GB laptop was tried and removed, because it was too weak to hunt or judge usefully and a degraded local mode would quietly produce worse audits.
- **Code leaves the machine.** Every scan sends code to a cloud API. Code under NDA or a bounty program's confidentiality clause cannot be scanned with it as configured; public contest code is fine.
- **A tool, not an auditor.** It does extraction, navigation and grunt tracing. Scope calls, exploitability, severity and duplicate judgment stay with me, and nothing gets submitted that I cannot explain unaided.
- **No recall number.** I am not publishing one. The benchmark I have is small, and a figure from it would claim more than it supports.
