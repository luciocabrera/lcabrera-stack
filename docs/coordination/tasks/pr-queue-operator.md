---
id: pr-queue-operator
title: Autonomous PR queue operator driven by a written merge policy
owner: agent:claude
status: active
branch: feat/536-pr-queue-operator
area:
  - .claude/pr-queue-policy.md
  - scripts/pr-queue-operator.mjs
  - scripts/lib/pr-queue-*.mjs
  - vite.config.ts
started: 2026-08-04
updated: 2026-08-04
plan: (none)
pr: (none)
issue: #536
---

## What

Autonomous PR queue operator driven by a written merge policy

## Status / next

- Current step: implemented, gated, dry-run against the live queue
- Blockers: none
- Next: review. The operator refuses to merge its own PR (policy S9), so this one
  needs a human on the merge button.
