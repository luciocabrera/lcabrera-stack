---
id: coverage-report-ratchet
title: Ratchet the coverage report so a public package cannot silently drop out
owner: agent:claude
status: review
branch: coverage-report-ratchet
area:
  - scripts/coverage-report.mjs
  - scripts/merge-coverage.mjs
  - scripts/lib/coverage-workspaces*
started: 2026-07-21
updated: 2026-07-21
plan: (none)
pr: '#229'
issue: #226
---

## What

Ratchet the coverage report so a public package cannot silently drop out

## Status / next

- Current step: in review — PR #229 open, full gate green, ratchet proven by
  three deliberate regressions
- Blockers: none
- Note: touches AGENTS.md, which the `publishing-hygiene` task also claims.
  Different sections (§4 coverage vs §1 packages), so the hunks do not
  collide; whichever lands second may need a trivial rebase.
- Next: merge, then close #226
