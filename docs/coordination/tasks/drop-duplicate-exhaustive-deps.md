---
id: drop-duplicate-exhaustive-deps
title: Drop the duplicate exhaustive-deps report
owner: agent:claude
status: review
branch: refactor/1412-drop-duplicate-exhaustive-deps
area:
  - packages/vite-configs/src/eslint.custom-rules.shared.config.mjs
  - .changeset/oxlint-owns-exhaustive-deps.md
  - .changeset/probe-oxlint-exhaustive-deps.md
  - docs/decisions/ADR-042*
  - docs/decisions/ADR-035*
  - packages/vite-configs/README.md
  - packages/repo-standards/scripts/lint-plugins*.mjs
  - packages/repo-standards/scripts/verify-lint-plugins.mjs
  - packages/repo-standards/README.md
  - packages/devkit/CLASSIFICATION.md
  - COMMANDS.md
  - .github/skills/lint-toolchain/SKILL.md
started: 2026-10-19
updated: 2026-10-20
plan: (none)
pr: #1429
issue: #1412
---

## What

Drop the duplicate exhaustive-deps report

## Status / next

- Current step: gate green, PR ready
- Blockers: none
- Next: review and merge
