---
id: 1568-adjudications-page
title: feat(showcase): add the adjudications page and the fp-panel evals suite
owner: agent:claude
status: review
branch: feat/1568-1568-adjudications-page
area:
  - apps/showcase/src/routes/evals/adjudications/**
  - apps/showcase/src/routes.ts
  - apps/showcase/e2e/evals/adjudications*
  - apps/showcase/e2e/evals/seed*
  - evals/fp-panel/**
  - evals/README.md
  - evals/runner-writes.test.mjs
  - devkit.config.json
  - scripts/adjudicate-panel.mjs
  - scripts/lib/panel-scope*
  - apps/showcase/src/routes/evals/.server/evalsHistory.service*
  - apps/showcase/src/routes/evals/.server/evalsPublicPayload.test.ts
  - apps/showcase/src/routes/evals/utils/evalsRouteEntries.util.test.ts
  - apps/showcase/src/INVENTORY.md
  - docs/agents/false-positive-panel.md
  - packages/eval-history/**
  - .github/workflows/agent-evals.yml
  - package.json
  - COMMANDS.md
started: 2026-11-10
updated: 2026-11-10
plan: (none)
pr: '#1617'
issue: #1568
---

## What

feat(showcase): add the adjudications page and the fp-panel evals suite

## Status / next

- Current step: gate green, PR ready for review
- Blockers: none
- Next:
