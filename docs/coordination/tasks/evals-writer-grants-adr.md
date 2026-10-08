---
id: evals-writer-grants-adr
title: Settle evals_writer as granted on the evals schema, not owner
owner: agent:claude
status: review
branch: docs/1347-evals-writer-grants-adr
area:
  - docs/decisions/ADR-13[0-9]*
  - packages/eval-history/README.md
  - packages/eval-history/scripts/migrate*.mjs
  - packages/eval-history/src/migrate/**
  - COMMANDS.md
started: 2026-10-06
updated: 2026-10-08
plan: (none)
pr: '#1354'
issue: #1347
---

## What

Settle evals_writer as granted on the evals schema, not owner

## Status / next

- Current step: evals:migrate reads EVALS_MIGRATE_DATABASE_URL; ADR-134 records the separate migrating role
- Blockers: none
- Next:
