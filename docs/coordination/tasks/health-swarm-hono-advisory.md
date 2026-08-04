---
id: health-swarm-hono-advisory
title: Move the pinned hono off the GHSA-8j4g-w8fx-2239 ReDoS advisory
owner: agent:claude
status: review
branch: fix/516-hono-redos-advisory
area:
  - pnpm-workspace.yaml
  - pnpm-lock.yaml
started: 2026-08-04
updated: 2026-08-04
plan: (none)
pr: (none)
issue: https://github.com/luciocabrera/vite-react-compiler/issues/516
---

## What

Adds a `hono: ^4.12.34` override so the transitively-resolved hono clears
GHSA-8j4g-w8fx-2239. `pnpm audit` goes from 1 moderate to 0.

## Status / next

- Current step: quality gate
- Blockers: none
- Next: open PR against main
