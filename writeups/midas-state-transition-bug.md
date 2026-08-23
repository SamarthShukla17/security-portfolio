---
title: "Midas Protocol — Reject-Flow Fund Recovery Gap"
date: "2026-08-22"
protocol: "Midas"
severity: "Critical (disputed)"
status: "Disputed"
summary: "reject_mint_request and reject_redeem_request contain zero token accounts — neither instruction can return user funds. mint_request transfers payment tokens immediately, before approval, to a non-custodied admin-set external wallet, with no on-chain recovery path on rejection. Submitted to Midas's security team; response received: intended behavior."
---

## Summary

`reject_mint_request` and `reject_redeem_request` — the two instructions
meant to let Midas unwind a pending mint or redeem request — contain zero
token accounts in their account lists. Neither instruction can move
funds, which means neither can actually return anything to a user once a
request is rejected. On the mint side this is more serious than it
sounds: `mint_request` transfers the user's payment tokens immediately,
before any approval step, to `vault_common.tokens_receiver` — an address
the program treats as an arbitrary external wallet, not one it custodies
itself. If that request is later rejected, there is no on-chain path
back to the user for those funds.

## Technical Detail

The mint-side gap is the one that matters. `mint_request` moves payment
tokens out of the user's control at request time, ahead of approval,
straight to `vault_common.tokens_receiver`. That receiver is
admin-configured and external to the program — the program does not
hold the tokens in a vault or PDA it controls, so once they land there,
on-chain recovery isn't possible regardless of what
`reject_mint_request` does or doesn't do. Because `reject_mint_request`
has no token accounts in its context, it was never going to be able to
claw anything back even if the receiver were custodied — but the
underlying trust assumption (send first, approve later, to an address
the program can't reach back into) is the real issue.

The redeem-side gap is less severe. `redeem_request` moves the user's
shares into a program-owned PDA rather than an external wallet, so the
funds stay within the program's control even after a rejection.
`reject_redeem_request` still doesn't move them back automatically — it
also has zero token accounts — but because the PDA is custodied by the
program, an admin can manually recover the funds via the existing
`withdraw_tokens` instruction. That's a process gap, not a fund-safety
gap.

## Verification

Traced by hand first, then independently corroborated with a standalone
LiteSVM invariant/fuzz harness built specifically for this: 5 invariants,
run across a 300-iteration randomized sequence of mint/redeem/reject
actions. All 300 iterations passed clean — no invariant caught a
violation, which is consistent with (and confirms) the manual read: the
gap is in what the reject instructions *don't* do, not in a state
transition that can be forced into an inconsistent shape. The harness's
job here was corroboration of an already-identified issue, not
discovery.

## Status

Submitted directly to the Midas security team via their disclosure
channel. Their response: this is intended behavior. That's noted here
transparently — this is an open disagreement about trust assumptions,
not a confirmed vulnerability, and the severity/status fields on this
writeup reflect that (Critical *(disputed)*, not Critical).

## Why It's Still Worth Documenting

Whether or not it's classified as a bug, the underlying trust assumption
is worth being explicit about: a user's payment tokens leave their
control and move to an uncustodied external address *before* any
approval step, with no on-chain recovery path if that request is later
rejected. Calling that "intended" doesn't change what it is for anyone
relying on the reject flow as a safety net. Documenting the disagreement
— rather than dropping the finding because it wasn't confirmed — is more
useful to anyone evaluating Midas than silence would be.
