---
title: "Kamino Lending Suite — klend, kvault, kfarms: Four Hypotheses Traced"
date: "2026-08-26"
protocol: "Kamino Finance"
severity: "N/A"
status: "Negative (Clean Audit)"
summary: "Four independent hypotheses across klend, kvault, and kfarms — liquidation-time division-by-zero, CPI reserve substitution, vault deposit/withdraw rounding asymmetry, and reward-accumulator desync — each dynamically verified against real or verbatim-extracted source. All four traced to an existing, correctly-functioning guard. No exploitable path found."
---

## Scope

Kamino's lending suite splits across three programs that call into each other — `klend` (the core lending market), `kvault` (an automated allocator that deposits idle liquidity into klend reserves on depositors' behalf), and `kfarms` (a separate reward-farming program klend leans on for incentive distribution). Cross-program surfaces like this are where I spend the most time: the interesting bugs are rarely in one program's own bookkeeping, they're in what each program assumes the other one already checked.

I went in with four specific hypotheses rather than a general sweep, each targeting one of those seams. All four came back negative — but "negative" did a different amount of work in each case, and that's worth being precise about rather than just reporting four green checkmarks.

## Hypothesis 1: Liquidation-Time Division-by-Zero

`Obligation::loan_to_value()` and `max_liquidatable_borrowed_amount()` both divide by a market-value field with no internal zero-guard — `fixed`'s `Fraction` type hard-panics on divide-by-zero, independent of any overflow-checks build flag. I confirmed the panic is real at the isolated math level: built a verbatim-extraction repro of both functions (the full crate won't build on this host — an unrelated `kfarms` BPF-alignment issue blocks the workspace, documented separately) and both panicked exactly where the source says they should.

That's not the end of the question, though — a panic in code nothing ever calls under the vulnerable condition isn't a finding. So I traced every caller. `calculate_liquidation`, `max_liquidatable_borrowed_amount`, and `check_liquidate_obligation` each have exactly one call site in the entire crate, all reached through `liquidate_obligation`. Ahead of that call, three explicit checks run first: `assert_obligation_liquidatable` rejects `deposited_value_sf == 0` and `borrow_factor_adjusted_debt_value_sf == 0` outright, and two per-position checks reject zero collateral or liquidity market value. The debt-side guard reads a differently-named field than the one the division actually uses (`borrow_factor_adjusted_market_value_sf` vs `market_value_sf`) — I didn't take the naming on faith and traced the assignment instead: the adjusted field is computed as `market_value_f * borrow_factor_f`, so a zero raw value guarantees a zero adjusted value with no rounding path around it. The guard covers the exact condition the division panics on.

The underlying zero condition is organically reachable — a sufficiently small token amount at a sufficiently small nonzero price can floor a fixed-point product below `U68F60`'s representable resolution — but every path into that state gets intercepted by one of the three guards before `liquidate_obligation` ever reaches the vulnerable division. A liquidator hitting a dust obligation gets a clean instruction error, not a panic.

**Residual note, not a finding:** both functions are `pub fn` with zero internal defense of their own — their safety is entirely externally enforced by callers checking a different field first, based on a derivation relationship that's correct today but isn't enforced by the type system or documented at the function boundary. A future caller that doesn't independently reproduce that exact guard shape would panic immediately. Flagged as a hardening recommendation, not a vulnerability: add the zero-guard locally inside the two functions rather than relying on every caller re-deriving the same reasoning.

## Hypothesis 2: CPI Reserve Substitution in kvault

`kvault`'s `Invest` instruction CPIs into klend to deposit idle vault liquidity into a reserve. The account struct on the kvault side is loose by design — `lending_market`, `lending_market_authority`, `reserve_liquidity_supply`, and `reserve_collateral_mint` are bare `AccountInfo`s with zero Anchor constraints; only `reserve` itself is type/owner-checked. On its face, that's a substitution opening: can an attacker supply a reserve the vault was never meant to use, and have real vault funds CPI'd somewhere they shouldn't?

I built a faithful re-implementation of the actual constraint checks — both kvault's own gate and the Anchor-generated constraints on klend's CPI target — as plain, directly testable Rust, in the same order they actually evaluate. Two layers hold independently:

- **kvault-side, before any CPI is issued:** `is_allocated_to_reserve` checks the requested reserve against `vault_allocation_strategy`, an admin-configured list. A reserve that was never added is rejected immediately — this runs regardless of whether the reserve is a real klend reserve at all.
- **klend-side, during the CPI:** even bypassing that, klend's own `DepositReserveLiquidity` struct enforces `has_one = lending_market` on the reserve and re-derives `lending_market_authority` from seeds, so a reserve/market pair that doesn't actually match each other is rejected on klend's side independently.

The case worth actually walking through is the middle one: an attacker who permissionlessly creates their *own*, fully self-consistent klend market and reserve — same mint as the target vault, so it would pass any mint-matching check too — passes klend's own validation cleanly, because from klend's perspective it's just an ordinary legitimate reserve. klend has no concept of "which vault is allowed to use which reserve" — that's not its job in a permissionless multi-market protocol. What stops it is entirely kvault's admin-controlled allocation list, which the attacker's reserve was never added to. I confirmed both halves of that explicitly rather than assuming: klend's checks pass on the self-consistent attacker reserve, and kvault's allocation gate independently blocks it before the CPI is ever reached.

## Hypothesis 3: Deposit/Withdraw Rounding Asymmetry in kvault

`get_shares_to_mint` (deposit side) divides using a `to_ceil()`-rounded denominator; `compute_user_total_received_on_withdraw` (withdraw side) floors throughout. Asymmetric rounding across a mint/redeem pair is a classic dust-arbitrage shape — repeat a small deposit-then-withdraw enough times and see if the rounding consistently favors the caller.

I ran two variants. First, an idle vault with pure-integer AUM (no invested position, no accrued interest) — under those conditions `to_ceil(aum) == to_floor(aum) == aum`, so the specific ceil/floor choice is mathematically inert, and the test isolates a more basic question: does floor(mint) + floor(redeem) on an integer-ratio round trip ever let the depositor come out ahead at all. Ten thousand dust round trips of 1 raw token unit each: zero leak events, net attacker PnL of exactly 0. Second, I gave the vault a genuinely fractional AUM (simulating accrued interest or an invested position's non-integer valuation) so `to_ceil(aum) != aum` and the flagged asymmetry could actually engage — same result, ten thousand round trips, net PnL of -10,000 (the attacker strictly lost value, as expected from floor-then-floor). A separate exhaustive sweep across a 2,000×2,000 grid of `(aum, shares_issued)` states confirmed no single isolated round trip profits the depositor either, worst case being exactly 0.

Worth being explicit about what's out of scope here: this reproduction doesn't include withdrawal penalties, fees, or interest accrual layered on top of this math in the real withdraw instruction — none of those run in the idle-liquidity scenario the hypothesis describes, and their absence, if anything, would only suppress arbitrage profit further, not create it.

## Hypothesis 4: Reward-Accumulator Desync in kfarms

kfarms' reward math is a MasterChef-style accumulator — a global `reward_per_share` that only increases, and a per-user `rewards_tally` snapshotting `reward_per_share * stake` at the user's last refresh. The risk isn't in any single call's rounding; it's whether some *reachable sequence* of stake changes, reward issuance, and refreshes can desync a user's tally from the accumulator such that `tally > reward_per_share * current_stake` — which underflows the subtraction in the real refresh function and panics.

Rather than hand-picking sequences, I built a stateful proptest fuzzer around the verbatim real accumulator/tally formulas — issue reward, refresh, stake up, stake down, harvest, across three simulated users — using the actual `decimal-wad` crate kfarms itself depends on, not a hand-rolled stand-in. Ten thousand randomized sequences of up to 40 actions each, with two invariants checked after every single action: no step panics, and total claimed-plus-pending rewards across all users never exceeds total rewards actually issued into the accumulator. All ten thousand sequences passed clean.

## Result

Four hypotheses, four negatives — but three different shapes of negative. Two (kvault CPI substitution, deposit/withdraw rounding) hold by direct, load-bearing guards that are exactly the right shape for the threat. One (reward desync) holds under ten thousand random adversarial sequences with no counterexample, which is meaningfully stronger evidence than a hand-traced argument would be. One (liquidation dust panic) is real at the isolated math level and only doesn't fire in production because of external guards whose correctness depends on a derivation relationship that isn't enforced anywhere the type system would catch it breaking — worth a hardening recommendation even though it's not exploitable today.

None of these are dramatic. That's expected, not a letdown — most of what a careful trace across a protocol this size turns up *should* be "the existing guard is correct," and the value isn't in finding a bug on demand, it's in being able to say precisely which of these four specific concerns are actually closed, and why, rather than leaving them as untested assumptions.
