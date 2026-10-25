---
id: workspace-yaml-rewrite
title: Find what rewrites pnpm-workspace.yaml in the created-workspace gate
owner: agent:claude
status: active
branch: test/1490-workspace-yaml-rewrite
area:
  - scripts/verify-devkit-workspace.mjs
  - scripts/lib/devkit-tree-run.mjs
  - scripts/lib/devkit-workspace*.mjs
  - packages/devkit/assets/**
started: 2026-10-25
updated: 2026-10-25
plan: (none)
pr: '#1491'
issue: #1490
---

## What

Find what rewrites pnpm-workspace.yaml in the created-workspace gate

## Status / next

- Current step: the gate's tracked-change finding prints the file's diff; the cause (pnpm's default non-strict release age writing `minimumReleaseAgeExclude`) is recorded on #1490
- Blockers: the blueprint fix needs a decision between the options listed on #1490
- Next: apply the chosen blueprint setting and replay the window
