---
id: scan-report-portable
title: Make the scan-report skills repo-agnostic and distributable
owner: agent:claude
status: review
branch: refactor/677-scan-report-portable
area:
  - .github/skills/**
  - packages/scan-report/**
  - packages/scan-ingestion/src/ingestion/**
  - packages/scan-ingestion/src/registry/**
  - packages/agent-runner/**
  - apps/scan-orchestrator/src/queue/**
  - packages/ts-configs/tsconfig.entries.ts
  - packages/vite-configs/vite.lint.shared.config.ts
  - scripts/lib/coverage-workspaces.mjs
  - scan-report.config.json
started: 2026-08-14
updated: 2026-08-14
plan: (none)
pr: https://github.com/luciocabrera/vite-react-compiler/pull/713
issue: #677
---

## What

Move the three deterministic scan runners and their shared machinery out of
`.github/skills/*/scripts/` into `packages/scan-report` (`@repo/scan-report`,
ADR-069), and replace the hardcoded CQMS ingestion call with a command the host
repository configures. The skills keep their `SKILL.md`; this repository keeps
ingesting via `scan-report.config.json`.

## Status / next

- Current step: implemented, gate green, PR open for review
- Blockers: none
- Next: merge
