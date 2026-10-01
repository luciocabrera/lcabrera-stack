---
id: table-e2e
title: test(showcase): exercise the table in the browser
owner: agent:grok
status: review
branch: test/1227-table-e2e
area:
  - apps/showcase/e2e/**
  - apps/showcase/playwright.config.ts
  - apps/showcase/vite.config.ts
  - apps/showcase/package.json
  - apps/showcase/tsconfig.e2e.json
  - apps/showcase/knip.json
  - .github/workflows/e2e.yml
  - COMMANDS.md
  - pnpm-workspace.yaml
  - pnpm-lock.yaml
  - packages/ts-configs/tsconfig.entries.ts
  - apps/showcase/tsconfig.app.json
  - packages/ui/src/components/Table/TableBodyCell/**
  - packages/ui/src/components/Table/TableContent/**
  - .changeset/**
started: 2026-10-01
updated: 2026-10-01
plan: (none)
pr: https://github.com/luciocabrera/lcabrera-stack/pull/1228
issue: #1227
---

## What

test(showcase): exercise the table in the browser

## Status / next

- Current step: draft pull request, local gate and browser suite green
- Blockers: none
- Next: CI runs the browser suite on the draft
