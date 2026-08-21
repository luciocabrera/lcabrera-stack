---
id: sweep-no-downgrade
title: stop the sweep downgrading a status it did not compute
owner: agent:claude
status: active
branch: chore/868-sweep-no-downgrade
area:
  - scripts/lib/review-gate-status.mjs
  - scripts/lib/review-gate-reconcile.mjs
  - scripts/reconcile-review-gates.mjs
  - docs/tooling/review-gate-reconcile.md
started: 2026-08-21
updated: 2026-08-21
plan: (none)
pr: '#880'
issue: #868
---

## What

Stop the scheduled sweep replacing a `success` it may not have computed (#868).

GitHub always runs a `schedule` from the default branch, so on a pull request that
changes what a gate decides, the sweep judges it with the code it is replacing. Measured
on #866: one head, one review list, opposite verdicts from the two copies.

## Why "don't downgrade" and not "only fill absence"

Both were on the table. "Only fill absence" — post only when no status exists for the
head — was recommended first and is **wrong**: the sweep's primary job is correcting a
status that already exists and is stale, which `review-gate-reconcile.md` states in its
first paragraph and pins in its diagnosis table (`success` would publish / `pending` is
shown → "reviewed, and the event that should have recomputed it went missing"). Only
filling absence would skip that row and quietly stop doing the thing the sweep is for.

"Don't downgrade" keeps that row and blocks the #866 overwrite.

## Scope

The rule lives in `shouldPublishStatus`, which is consulted only under `--if-changed`,
and `gateArgs` is its only caller — so it applies to the sweep alone. The gate workflows
invoke the scripts bare, so event-driven runs still publish a downgrade, which is what
keeps a dismissed review working.

## Status / next

- Current step: implemented, tests pinned from both directions, docs updated
- Blockers: none
- Next: push, flip #880 out of draft, drive to merged
