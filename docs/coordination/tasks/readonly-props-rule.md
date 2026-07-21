---
id: readonly-props-rule
title: 'feat(tooling): enforce the props-typing convention'
owner: agent:claude
status: active
branch: feat/readonly-props-rule
area:
  - packages/eslint-local-rules/**
  - packages/vite-configs/eslint.restrictions.shared.mjs
  - packages/vite-configs/eslint.custom-rules.shared.config.mjs
  - .claude/rules/react-components.md
  - .github/skills/react-19/SKILL.md
started: 2026-07-21
updated: 2026-07-21
plan: (none)
pr: (none)
issue: #193
---

## What

The props-typing convention was consistent in the code (62 uses of
`ComponentPropsWithoutRef`, ~110 of `readonly children: ReactNode`, 0 of
`PropsWithChildren`) but stated nowhere, and the `readonly` clause of
Non-Negotiable Rule 1 was the one quarter no linter enforced.

Adds `local-rules/readonly-props` (autofixable), blocks `PropsWithChildren` by
name, and writes the decision table into the rules and the react-19 skill.

## Status / next

- Current step: implemented; 13 rule tests, deliberate violations verified to
  fail and autofix verified, all React workspaces clean
- Blockers: none
- Next: open the PR
