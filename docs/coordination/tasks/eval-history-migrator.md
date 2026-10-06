---
id: eval-history-migrator
title: Add the migrator and the evals schema to @repo/eval-history
owner: agent:claude
status: review
branch: feat/1268-eval-history-migrator
area:
  - packages/eval-history/src/migrate/**
  - packages/eval-history/migrations/**
  - packages/eval-history/scripts/migrate.mjs
  - packages/eval-history/package.json
  - packages/eval-history/vite.config.ts
  - packages/eval-history/README.md
  - .github/workflows/check-safe.yml
  - COMMANDS.md
  - AGENTS.md
started: 2026-10-06
updated: 2026-10-06
plan: (none)
pr: '#1341'
issue: #1268
---

## What

Add the migrator and the evals schema to @repo/eval-history

## Status / next

- Current step: migrator, first migration and CI Postgres service in review
- Blockers: none
- Next: merge
