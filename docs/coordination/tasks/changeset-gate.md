---
id: changeset-gate
title: require a changeset in CI when a published package changes
owner: agent:claude
status: review
branch: ci/1472-changeset-gate
area:
  - scripts/verify-changesets.mjs
  - scripts/lib/changeset-*
  - scripts/lib/verify-changesets.test.mjs
  - AGENTS.md
  - docs/agents/epic-orchestration.md
  - docs/agents/agent-review-contract.md
  - packages/devkit/CLASSIFICATION.md
  - .github/workflows/check-safe.yml
  - .github/skills/releasing/**
  - COMMANDS.md
  - package.json
started: 2026-10-25
updated: 2026-10-25
plan: (none)
pr: https://github.com/luciocabrera/lcabrera-stack/pull/1489
issue: #1472
---

## What

require a changeset in CI when a published package changes

## Status / next

- Current step: gate built, documented and wired into check-safe.yml
- Blockers: none
- Next: review
