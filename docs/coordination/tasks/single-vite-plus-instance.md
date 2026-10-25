---
id: single-vite-plus-instance
title: Resolve TypeScript 7 everywhere with TypeScript 6 for ESLint
owner: agent:claude
status: review
branch: build/1452-single-vite-plus-instance
area:
  - package.json
  - pnpm-lock.yaml
  - pnpm-workspace.yaml
  - .pnpmfile.cjs
  - .fallowrc.json
  - scripts/lib/eslint-typescript.cjs
  - scripts/eslint-typescript.test.mjs
  - scripts/lib/semver-range.cjs
  - scripts/lib/semver-range.test.mjs
  - packages/repo-standards/scripts/verify-eslint-pass.mjs
  - .changeset/eslint-pass-typescript-7-hint.md
  - docs/decisions/ADR-139-*.md
started: 2026-10-22
updated: 2026-10-25
plan: (none)
pr: '#1484'
issue: #1452
---

## What

Resolve one vite-plus instance for the root and every workspace

## Status / next

- Current step: TypeScript 7 catalog, TypeScript 6 for ESLint via .pnpmfile.cjs
- Blockers: none
- Next: review
