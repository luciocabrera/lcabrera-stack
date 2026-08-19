---
id: gate-inventory-drift
title: Gate .util.ts exports against their package INVENTORY.md
owner: agent:claude
status: review
branch: chore/817-gate-inventory-drift
area:
  - scripts/verify-inventory.mjs
  - scripts/inventory-drift-baseline.json
  - scripts/lib/inventory-*.mjs
  - package.json
  - COMMANDS.md
  - .github/workflows/check-safe.yml
started: 2026-08-19
updated: 2026-08-19
plan: (none)
pr: https://github.com/luciocabrera/vite-react-compiler/pull/818
issue: #817
---

## What

Gate .util.ts exports against their package INVENTORY.md

## Status / next

- Current step: `vp run check:safe` green, deliberate-violation probe recorded, PR #818 ready for review
- Blockers: none
- Next: address review feedback, then merge and close this task
