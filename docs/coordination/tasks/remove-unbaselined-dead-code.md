---
id: remove-unbaselined-dead-code
title: Remove unbaselined dead code and add a whole-tree tripwire
owner: agent:claude
status: active
branch: refactor/1419-remove-unbaselined-dead-code
area:
  - .fallowrc.json
  - package.json
  - COMMANDS.md
  - .github/workflows/check-safe.yml
  - scripts/lib/**
  - packages/repo-standards/scripts/**
  - packages/devkit/scripts/**
  - packages/ui/src/**
  - packages/eslint-local-rules/src/create-rule.ts
  - packages/devkit/CLASSIFICATION.md
  - apps/showcase/src/routes/wide-alltypes-150/config/index.ts
  - evals/agent-sessions.test.mjs
  - evals/skills/**
  - AGENTS.md
  - .claude/README.md
  - .claude/rules/scripts.md
  - .github/skills/fallow-code-checker/**
  - .github/skills/health-swarm/charters/dead-code.md
  - docs/tooling/fallow-summary.md
  - .changeset/remove-unreachable-internal-exports.md
started: 2026-10-20
updated: 2026-10-20
plan: (none)
pr: '#1449'
issue: #1419
---

## What

Remove unbaselined dead code and add a whole-tree tripwire

## Status / next

- Current step: just claimed
- Blockers: none
- Next:
