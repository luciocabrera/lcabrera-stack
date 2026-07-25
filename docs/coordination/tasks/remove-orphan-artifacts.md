---
id: remove-orphan-artifacts
title: Remove orphan artifacts and the excludes that only shielded them
owner: agent:claude
status: review
branch: chore/419-remove-orphan-artifacts
area:
  - reports/*.md
  - packages/ts-configs/**
  - packages/vite-configs/*.shared.config.*
  - reports/*.md
  - packages/ts-configs/**
started: 2026-07-25
updated: 2026-07-25
plan: (none)
pr: '#420'
issue: #419
---

## What

Removes tracked files nothing reads, and the exclude entries whose only job was
to shield them.

- `miscelanious/` — two render-timing captures from January, referenced by
  nothing but named in eight exclude lists.
- Three one-off write-ups under `reports/` that no command reproduces and nothing
  links to. ADR-049 left this call open; it is made here.
- The dead exclude entries themselves, including two that pointed at paths which
  never existed in this layout (`utils`, `vite-monorepo/apps/api-server`).
- Three coordination task files for PRs that had already merged.

## Status / next

- Current step: gate green, PR #420 out of draft.
- Blockers: none.
- Next: delete this file when #420 merges.
