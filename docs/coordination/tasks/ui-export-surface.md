---
id: ui-export-surface
title: fix(ui): close the wildcard export leak before grouping widens it
owner: agent:claude
status: review
branch: chore/565-ui-export-surface
area:
  - packages/ui/package.json
  - reports/api-surface/**
  - scripts/verify-import-surface.mjs
  - scripts/lib/exports-resolve.mjs
started: 2026-08-12
updated: 2026-08-12
plan: (none)
pr: https://github.com/luciocabrera/vite-react-compiler/pull/621
issue: #565
---

## What

fix(ui): close the wildcard export leak before grouping widens it

## Status / next

- Current step: #ui/* internals + curated exports landed; PR #621 open
- Blockers: none
- Next:
