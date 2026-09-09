---
id: devkit-shipped-ranges
title: Ship a range that admits the next minor, and gate it
owner: agent:claude
status: review
branch: fix/1129-devkit-shipped-ranges
area:
  - packages/devkit/assets/workspace/pnpm-workspace.yaml
  - packages/devkit/assets/workspace/packages/typescript-config/package.json
  - scripts/verify-shipped-ranges.mjs
  - scripts/lib/shipped-ranges*
  - docs/decisions/ADR-116-*
  - packages/devkit/scripts/workspace.test.mjs
started: 2026-09-09
updated: 2026-09-09
plan: (none)
pr: '#1135'
issue: #1129
---

## What

Ship a range that admits the next minor, and gate it

## Status / next

- Current step: the fix, the gate and its wiring are in; the gate fires on the
  pre-fix assets and passes on the fixed ones
- Blockers: none
- Next: verification of #1135
- Overlap declared: `packages/devkit/scripts/workspace.test.mjs` sits inside the
  `packages/devkit/scripts/**` area #1077 claims. The two-line edit there
  unquotes a catalog value in that file's own YAML reader, which the quoted
  range in the blueprint catalog would otherwise compare against unequal.
