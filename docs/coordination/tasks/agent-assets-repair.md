---
id: agent-assets-repair
title: 'fix(tooling): repair the agent assets that point at a tree that moved'
owner: agent:claude
status: active
branch: fix/agent-assets-repair
area:
  - .claude/agents/**
  - .claude/settings.json
  - .claude/README.md
  - .github/skills/react-19/**
  - scripts/bootstrap-agenting-handoff.cjs
  - scripts/generate-source-smell-report.cjs
started: 2026-07-21
updated: 2026-07-21
plan: (none)
pr: (none)
issue: #184
---

## What

The auto-loaded agent assets had drifted from the repo:

- `architecture-guard` researched six paths that no longer exist
- the `react-19` skill mandated `ComponentWithChildren`, which is not a React
  type and is defined nowhere here
- the `quality-gate` agent's 4-row table hid ESLint, Biome and real `tsc`
- the `Stop` hook covered one app and could not see untracked files
- two scripts no workflow invokes, plus their unread outputs
- `.claude/README.md` documented a hook that does not exist

## Status / next

- Current step: implemented; every named path verified to resolve, verifiers green
- Blockers: none
- Next: open the PR
