---
id: table-ui-fixes
title: Four independent fixes in packages/ui Table
owner: agent:other
status: active
branch: (uncommitted)
area:
  - packages/ui/src/components/Table/**
started: 2026-07-17
updated: 2026-07-18
plan: task-four-independent-vast-galaxy.md
pr: (none)
---

## What

Four independent fixes in the `packages/ui` Table, sequenced by ascending risk
(column resize among them). Tracked here because it is **active work owned by
another agent** — this is the exact task that caused a near-miss when a second
agent almost edited the same column-resize code with no signal that it was taken.

The area lock (`packages/ui/src/components/Table/**`) is the point: any agent
about to touch the ui Table should see this claim first.

## Status / next

- Owner: another agent (scratch: `~/.claude/plans/task-four-independent-vast-galaxy.md`, out-of-git).
- If you are that agent: set `owner:` to your name, point `branch:` at your branch,
  and bump `updated:` as you go. Delete this file when the work merges.
- If you are NOT that agent: do not edit files under `packages/ui/src/components/Table/**`
  without coordinating — check with the owner or narrow the overlap first.
