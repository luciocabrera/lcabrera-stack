---
id: tinypool-advisory
title: Clear the tinypool and sprintf-js advisories
owner: agent:claude
status: review
branch: build/1328-tinypool-advisory
area:
  - pnpm-workspace.yaml
  - pnpm-lock.yaml
  - docs/agents/dependency-advisories.json
  - packages/devkit/assets/workspace/pnpm-workspace.yaml
  - .changeset/**
started: 2026-10-06
updated: 2026-10-06
plan: (none)
pr: #1330
issue: #1328
---

## What

Clear the tinypool and sprintf-js advisories

## Status / next

- Current step: in review on #1330; tinypool overridden in the root and the devkit workspace blueprint, sprintf-js carried under a dated allowance
- Blockers: none
- Next: merge; delete the sprintf-js allowance when #1313 lands
