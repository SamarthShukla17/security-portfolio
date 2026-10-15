---
title: "EverValue DualDefense — Triple-Pass Contest Review"
date: "2026-10-02"
protocol: "EverValue"
severity: "N/A"
status: "Engagement"
chain: "Arbitrum · Solidity"
scope: "3 contracts"
highlights:
  - "Triple-pass review"
  - "Economic viability gate"
  - "Critical-only scope"
summary: "HackenProof contest engagement on EverValue, an ERC-20 token backed by a wBTC reserve with a burn-price floor. Three independent passes (multi-agent AI scan, custom harness scan, manual line-by-line), with every candidate required to pass an economic viability check before submission."
---

**Platform:** HackenProof Contest

**Protocol:** EverValue, an ERC-20 token with a wBTC reserve and a burn-price floor

**Language:** Solidity, deployed on Arbitrum

**Scope:** 3 contracts at a pinned commit, Critical impacts only

---

## Scope Shapes the Method

A Critical-only contest changes what's worth chasing. Low and Medium issues aren't eligible, so the only question that matters for each candidate is whether it moves real value at a real profit to the attacker under conditions that actually occur. I set that bar before reading any code and held every candidate to it.

## Three Independent Passes

Each pass used a different approach, so that one blind spot wouldn't shape the whole review:

1. **Multi-agent AI scan.** Several independent agents each reviewed the full scope and produced candidates. I treat this as a way to generate hypotheses, not to verify them. When several agents agree on something, I count that as one observation, not several, because they tend to share the same assumptions.
2. **Custom harness scan.** A second, separately configured tooling pass with its own knowledge base and its own judging step, run against the same pinned commit.
3. **Manual line-by-line.** A full read of all three contracts by hand. This pass also decided every candidate the first two produced: confirmed with a PoC, or closed by pointing to the exact line that rules it out.

## The Economic Gate

A token with a reserve and a price floor is an economic system as much as a code system. A path can be technically reachable and still lose the attacker money once you account for real market prices, liquidity, and fees.

So every candidate that survived the technical passes also went through a viability analysis against live market conditions, not idealized ones. Candidates that worked only under hypothetical conditions, or that cost more to run than they returned at current prices, were closed before submission. That held even when the PoC itself ran cleanly. Holding back a technically valid issue because the economics don't work is part of the job.

---

Engagement completed. Details covered by HackenProof disclosure policy.
