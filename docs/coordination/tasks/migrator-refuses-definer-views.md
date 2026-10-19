---
id: migrator-refuses-definer-views
title: fix(eval-history): make evals:migrate refuse an owner-privilege reporting view
owner: agent:claude
status: review
branch: fix/1404-migrator-refuses-definer-views
area:
  - packages/eval-history/src/migrate/**
  - packages/eval-history/src/queries/readerBoundary*
  - packages/eval-history/scripts/migrate.mjs
  - packages/eval-history/README.md
  - docs/decisions/ADR-137-*
started: 2026-10-19
updated: 2026-10-19
plan: (none)
pr: https://github.com/luciocabrera/lcabrera-stack/pull/1405
issue: #1404
---

## What

fix(eval-history): make evals:migrate refuse an owner-privilege reporting view

## Status / next

- Current step: just claimed
- Blockers: none
- Next:
