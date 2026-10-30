---
id: fallow-analysis-gates
title: Add the fallow analysis scripts and wire them into hooks and CI
owner: agent:claude
status: review
branch: ci/1552-fallow-analysis-gates
area:
  - package.json
  - COMMANDS.md
  - vite.config.ts
  - .github/workflows/check-safe.yml
  - scripts/changed-files.sh
  - scripts/verify-suppressions.mjs
  - .changeset/fallow-gate-bin.md
  - .changeset/eslint-ignore-fallow-state.md
  - packages/repo-standards/package.json
  - packages/repo-standards/README.md
  - packages/repo-standards/ARCHITECTURE.md
  - packages/repo-standards/scripts/*fallow-gate*
  - packages/repo-standards/scripts/verify-script-exits.mjs
  - devkit.config.json
  - packages/vite-configs/src/eslint.*
  - packages/devkit/CLASSIFICATION.md
started: 2026-10-30
updated: 2026-10-30
plan: (none)
pr: '#1572'
issue: #1552
---

## What

Add the fallow analysis scripts and wire them into hooks and CI

## Status / next

- Current step: just claimed
- Blockers: none
- Next:
