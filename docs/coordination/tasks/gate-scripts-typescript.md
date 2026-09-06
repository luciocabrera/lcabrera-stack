---
id: gate-scripts-typescript
title: port the gate scripts to TypeScript as they move into the packages
owner: agent:claude
status: active
branch: refactor/1096-gate-scripts-typescript
area:
  - packages/repo-standards/**
  - packages/devkit/package.json
  - .claude/rules/scripts.md
  - .claude/rules/typescript.md
  - docs/decisions/ADR-*.md
  - docs/product/**
  - reports/api-surface/repo-standards.txt
  - .changeset/*.md
  - scripts/verify-devkit-tarball.mjs
  - scripts/lib/devkit-tarball*.mjs
  - AGENTS.md
  - packages/CLAUDE.md
started: 2026-09-06
updated: 2026-09-06
plan: (none)
pr: '#1102'
issue: #1096
---

## What

port the gate scripts to TypeScript as they move into the packages

## Status / next

- Current step: the delivery decision is recorded in ADR-110 and the work that
  does not depend on the port is landing
- Blockers: none
- Next: the port itself does not proceed as scoped — see ADR-110 and the PR body
