---
id: suppressions-provisional-gate
title: Make suppressions:verify fail on a provisional entry
owner: agent:claude
status: review
branch: chore/510-suppressions-provisional-gate
area:
  - scripts/verify-suppressions.mjs
  - scripts/lib/suppressions.mjs
  - scripts/lib/suppressions.test.mjs
  - scripts/lib/suppressions-gate.test.mjs
  - docs/agents/public-package-suppressions.md
  - docs/agents/public-package-suppressions.json
started: 2026-08-04
updated: 2026-08-04
plan: (none)
pr: '#513'
issue: #510
---

## What

Make suppressions:verify fail on a provisional entry. A register entry parked as
`provisional` used to ride along in a green build, because the status was
counted into a message suffix rather than into the failure lanes.

## Status / next

- Current step: implemented; gate exercised against a planted provisional entry
- Blockers: none
- Next: review
