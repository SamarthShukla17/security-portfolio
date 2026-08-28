---
title: "Midas Protocol — Reject-Flow Fund Recovery Gap"
date: "2026-08-22"
protocol: "Midas"
severity: "Critical (disputed)"
status: "Disputed"
summary: "reject_mint_request and reject_redeem_request contain zero token accounts — neither instruction can return user funds. mint_request transfers payment tokens immediately, before approval, to a non-custodied admin-set external wallet, with no on-chain recovery path on rejection. Submitted to Midas's security team; response received: intended behavior."
---

## Scope

Midas runs an approve/reject flow on top of mint and redeem: a user submits a request, an admin later approves or rejects it. My first pass on any protocol with a two-step admin gate like this is to check the unhappy path first, not the happy one — approve flows get exercised constantly and get bugs shaken out of them by normal usage; reject flows are the ones nobody hits until something's already gone wrong, which is exactly when you don't want a surprise.

So I went straight to `reject_mint_request` and `reject_redeem_request` and read their account lists before reading anything else.

## The Gap

Neither instruction has a token account anywhere in its context. That's not a subtle omission — it's the kind of thing that's obvious the moment you check, which is also why it's easy to miss: nobody expects an instruction literally named "reject" to be incapable of moving a token. Zero token accounts means zero capacity to return funds, structurally, regardless of what the instruction logic does with them.

Whether that's catastrophic or just a paperwork gap depends entirely on where the funds were sitting when the reject fires, and that's where mint and redeem diverge.

**Mint side — this is the one that matters.** `mint_request` moves the user's payment tokens immediately, before any approval step, to `vault_common.tokens_receiver`. I checked what that account actually is rather than assuming: it's admin-configured and external — not a vault or PDA the program holds custody of. Once those tokens land there, no instruction in the program can reach back into that wallet. It's not "the reject instruction forgot a step," it's "there is no step that could exist," because the program never retained control of the funds in the first place. The trust model here is send-first-approve-later, to an address the program has no authority over. `reject_mint_request` having no token accounts isn't the root cause; it's a symptom of the root cause, which is that the funds already left on request, not on approval.

**Redeem side — less severe, and worth being precise about why.** `redeem_request` moves the user's shares into a program-owned PDA, not an external wallet. So on rejection, the funds are still inside the program's custody — `reject_redeem_request` just doesn't move them back *automatically*, since it also has zero token accounts. But because the PDA is custodied by the program, an admin can manually pull the funds back out through the existing `withdraw_tokens` instruction. That's a missing automation step, not a loss of funds. I want to be exact about that distinction because it's the difference between "process gap" and "money is gone," and conflating the two would overstate the redeem-side finding.

## Verification

Hand-tracing an account list is fast, but it's also exactly the kind of thing you can misread once and then anchor on. I built a standalone LiteSVM invariant/fuzz harness to check the claim independently rather than just re-reading the same code a second time: 5 invariants around fund conservation and request-state consistency, run across a 300-iteration randomized sequence of mint/redeem/reject actions in arbitrary order. All 300 passed clean — no invariant fired. That's the expected result if the bug is "the reject instructions structurally can't move funds" rather than "some sequence of calls corrupts state," and it matched the hand trace. The harness wasn't how I found this; it's how I made sure the hand trace was right before writing it up.

## Disclosure

Sent directly to the Midas security team through their disclosure channel. Their read: this is intended behavior, not a bug — consistent with an institutional compliance model where rejected KYC/AML flows get settled off-chain rather than reversed on-chain.

I'm not going to argue with a team about their own trust model in their own writeup, so this is filed as disputed, not confirmed — that's what the severity field reflects (`Critical (disputed)`, not `Critical`).

## Why It's Worth Documenting

Disputed isn't the same as resolved. Whether it's "intended" or not doesn't change what a user relying on the reject flow as a safety net actually gets: their payment tokens left their control before approval, to an address the program can't recover from, with no reject-path way back. Whatever you call that, it's the actual behavior anyone integrating with or depositing into Midas is exposed to, and that's worth having on the record even in disagreement rather than dropped for lack of a confirmation.
