---
id: eval-scheduled-retain
title: Run the model suites weekly on main and apply transcript retention
owner: agent:claude
status: review
branch: ci/1282-eval-scheduled-retain
area:
  - .github/workflows/evals-scheduled.yml
  - packages/eval-history/src/retain/**
  - packages/eval-history/scripts/retain.mjs
  - packages/eval-history/scripts/lib/evals-cli.mjs
  - packages/eval-history/package.json
  - packages/eval-history/README.md
  - package.json
  - COMMANDS.md
  - evals/README.md
started: 2026-10-18
updated: 2026-10-18
plan: (none)
pr: '#1401'
issue: #1282
---

## What

Run the model suites weekly on main and apply transcript retention

## Status / next

- Current step: built; weekly workflow and `evals:retain` in PR #1401
- Blockers: none
- Next: four weekly runs on main without a manual fix (issue §6, as amended on #1260)
