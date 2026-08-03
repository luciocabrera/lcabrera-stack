---
id: autofix-hook-drop-biome
title: Drop the Biome pass from the Claude autofix hook to cut per-edit latency
owner: agent:claude
status: active
branch: perf/499-drop-biome-from-autofix-hook
area:
  - scripts/claude-autofix.mjs
started: 2026-08-03
updated: 2026-08-03
plan: (none)
pr: (none)
issue: #499
---

## What

`scripts/claude-autofix.mjs` launches three fixers per edited file — Oxlint,
Biome, Oxfmt. Measured, ~95% of the cost is process startup rather than analysis,
so a TypeScript edit blocks the agent loop for ~1,552 ms. Dropping the Biome step
removes one launch (~600 ms).

Safe because the hook is an autofixer, not a gate: it swallows every failure and
always exits 0. Biome stays enforced in all three real gates — `vp staged` at
pre-commit (same `*.{ts,tsx,mjs,cjs}` glob the hook used), `check:push` at
pre-push, and the Biome step in `check-safe.yml`.

## Status / next

- Current step: edit the script, verify the pre-commit Biome gate still blocks
- Blockers: none
- Next: open PR against `main`, then delete this file when it merges
