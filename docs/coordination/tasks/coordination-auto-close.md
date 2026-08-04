---
id: coordination-auto-close
title: Delete the task file automatically when its PR merges
owner: agent:claude
status: review
branch: chore/529-coordination-auto-close
area:
  - scripts/close-coordination-claim.mjs
  - scripts/lib/coordination-close*.mjs
  - scripts/lib/coordination-parse.mjs
  - scripts/verify-coordination.mjs
  - .github/workflows/coordination-close.yml
  - docs/coordination/README.md
  - COMMANDS.md
started: 2026-08-04
updated: 2026-08-04
plan: (none)
pr: '#533'
issue: #529
---

## What

Delete the task file automatically when its PR merges

## Status / next

- Current step: implemented; full gate green; awaiting verification
- Blockers: none
- Next: merge — the workflow deletes this file on its own merge
