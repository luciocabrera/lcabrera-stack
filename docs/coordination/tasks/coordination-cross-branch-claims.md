---
id: coordination-cross-branch-claims
title: Make coordination:verify see claims on other branches
owner: agent:claude
status: review
branch: coordination-cross-branch-claims
area:
  - scripts/verify-coordination.mjs
  - scripts/lib/coordination-*.mjs
started: 2026-07-22
updated: 2026-07-22
plan: (none)
pr: '#283'
issue: #233
---

## What

`coordination:verify` read task files from the working tree only, so it saw each
agent's own claim and nobody else's — and `coordination:claim` commits the task
onto the branch it creates, so a claim is off-`main` for the life of the work.
Both sides of a real collision got "0 warnings".

Overlap detection now also reads claims from every live branch on `origin`.
Anything it cannot read (no local ref, or a ref behind origin) is reported
rather than skipped, so "clean" never means "could not look".

## Status / next

- Current step: gate green; the cross-branch warning demonstrated end-to-end
  against the real remote, which also exposed a duplicate-warning bug the unit
  tests missed (one claim is inherited by every branch cut from `main`)
- Blockers: none
- Next: merge #283
