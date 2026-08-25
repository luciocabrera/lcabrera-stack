---
id: remove-scan-report-app-graph
title: chore(repo): remove scan-report and the app-graph skill
owner: agent:claude
status: review
branch: chore/941-remove-scan-report-app-graph
area:
  - packages/scan-report/**
  - .github/skills/app-graph/**
  - .github/skills/linter-checker/**
  - .github/skills/fallow-code-checker/**
  - .github/skills/code-smell-checker/**
  - .github/skills/code-smell-zen/**
  - .github/skills/code-smell-shared/**
  - docs/decisions/ADR-*-retire-the-scan-report-pipeline.md
  - .fallowrc.json
  - vite.config.ts
  - package.json
  - packages/ts-configs/tsconfig.entries.ts
started: 2026-08-25
updated: 2026-08-25
plan: (none)
pr: #942
issue: #941
---

## What

chore(repo): remove scan-report and the app-graph skill

## Status / next

- Current step: implemented, full `check:safe` green, PR #942 ready for review
- Blockers: none
- Next: address review, then merge
