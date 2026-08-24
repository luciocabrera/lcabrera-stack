---
id: docs-homes-policy
title: Stop requiring per-component architecture files and essay comments
owner: agent:claude
status: active
branch: docs/900-docs-homes-policy
area:
  - AGENTS.md
  - docs/README.md
  - docs/decisions/ADR-088-*
  - docs/agents/**
  - .github/skills/quality-gate-workflow/**
  - .github/pull_request_template.md
  - .github/skills/store-pattern/**
  - .claude/README.md
  - .claude/agents/architecture-guard.md
  - .claude/agents/refactor-builder.md
  - packages/ui/src/PATTERNS.md
  - packages/ui/src/INVENTORY.md
  - packages/server/src/INVENTORY.md
  - apps/react-router/src/INVENTORY.md
  - apps/react-router/docs/enterprise_coding_standards.md
started: 2026-08-24
updated: 2026-08-24
plan: (none)
pr: #901
issue: #900
---

## What

Stop requiring per-component architecture files and essay comments.
ADR-088: architecture docs describe systems, not every folder.

## Status / next

- Current step: instructions + ADR + inventory compact; gate next
- Blockers: none
- Next: quality gate, then flip the draft PR description
