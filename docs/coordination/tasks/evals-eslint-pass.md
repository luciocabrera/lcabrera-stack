---
id: evals-eslint-pass
title: Run the eslint pass over evals/
owner: agent:claude
status: review
branch: build/1345-evals-eslint-pass
area:
  - evals/**/*.mjs
  - eslint.config.mjs
  - package.json
  - COMMANDS.md
  - pnpm-lock.yaml
  - packages/vite-configs/src/eslint.*.mjs
  - packages/vite-configs/README.md
  - packages/repo-standards/scripts/*eslint-staged*
  - .github/skills/lint-toolchain/SKILL.md
  - .github/skills/quality-gate-workflow/SKILL.md
  - .changeset/*
  - docs/decisions/ADR-135-lint-evals-*
started: 2026-10-08
updated: 2026-10-08
plan: (none)
pr: https://github.com/luciocabrera/lcabrera-stack/pull/1365
issue: #1345
---

## What

Run the eslint pass over evals/

## Status / next

- Current step: gate green, PR ready for review
- Blockers: none
- Next: merge
