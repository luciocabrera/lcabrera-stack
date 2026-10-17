---
id: eval-baseline
title: feat(evals): record an A/A noise floor with evals:baseline
owner: agent:claude
status: review
branch: feat/1272-eval-baseline
area:
  - evals/run-baseline*
  - evals/baseline-*
  - evals/run-envelope*
  - evals/run-record*
  - evals/runner-writes.test.mjs
  - packages/eval-history/src/baseline/**
  - packages/eval-history/src/ingest/envelopeFileSystem.util*.ts
  - packages/eval-history/src/ingest/evalsDatabaseUrl.util*.ts
  - packages/eval-history/src/ingest/ingestPaths.service.ts
  - packages/eval-history/src/envelope/envelope.constants.ts
  - packages/eval-history/src/envelope/envelope.schema.ts
  - packages/eval-history/src/testing/integrationDatabase.service.ts
  - packages/eval-history/src/ingest/ingestPaths.integration.test.ts
  - packages/eval-history/package.json
  - packages/eval-history/README.md
  - package.json
  - COMMANDS.md
  - evals/README.md
started: 2026-10-08
updated: 2026-10-16
plan: (none)
pr: '#1362'
issue: #1272
---

## What

feat(evals): record an A/A noise floor with evals:baseline

## Status / next

- Current step: implemented, gate green, PR ready for review
- Blockers: none
- Next: verifier and review
