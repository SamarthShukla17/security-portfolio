---
title: "The Capability-Delta Test: A One-Sentence Filter That Kills Most False Findings"
date: "2026-10-22"
protocol: "Cross-Protocol"
severity: "N/A"
status: "Methodology"
summary: "On the gap between 'this code looks wrong' and 'this is a finding' — and the single question that separates them."
---

Every audit produces far more hypotheses than findings. Reading enough DeFi code trains an eye for things that look off — a loop with no obvious bound, a check that seems to skip a case, a comment that doesn't quite match the code below it. Most of these die the moment you ask one question: before this code existed in its current form, what could an actor do — and after, what can they do that's actually different?

If the honest answer is "the same thing, just through a different path, or a few blocks later," that's a reachability observation, not a finding. It's worth noting in the scratch file and moving on. The bar for a real finding is a genuine delta in what's possible, not a different route to something that was already possible.

## The Adjacent Defense

Where this earns its keep is on the candidates that survive the first question. Once there's a real delta, the next move is checking whether the team already thought about the neighboring problem. Codebases that have been through a few audit cycles are rarely naive across the board — they tend to have defended the version of this bug they thought of, and missed the version they didn't. Three places this shows up constantly:

- A cap enforced on one of two structurally identical fields, missing on its sibling.
- A write-off path that clamps a downstream accounting figure back down after an exceptional event, with no equivalent clamp on the mirror-image path.
- A scoping check correctly applied three lines below the vulnerable one, in the same function, by the same author.

Finding this pattern changes the whole shape of a report. It stops being "here's a theoretical gap" and becomes "here's the exact defense this team already built for the adjacent case, and here's why it doesn't cover this one" — which is a much harder thing for a project to wave away as intended behavior, because the burden shifts to explaining why the same reasoning that justified the adjacent defense doesn't apply here.

## Upstream of Writing

The discipline this enforces is upstream of writing, not downstream. Applying the capability-delta test before drafting means a report never gets written around a bug that turns out to be a reachability observation in disguise — the question kills it at the hypothesis stage, where it's cheap, instead of after hours spent on a PoC and a writeup that a triager rejects in the first paragraph. It's a small test. It's also the single highest-leverage filter in the whole process, because it's the one most hypotheses actually fail.
