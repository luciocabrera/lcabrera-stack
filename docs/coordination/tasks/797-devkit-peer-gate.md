---
id: 797-devkit-peer-gate
title: Enforce a skill's declared gate-runtime version range
owner: agent:claude
status: active
branch: feat/797-797-devkit-peer-gate
area:
  - packages/devkit/scripts/**
  - packages/devkit/package.json
  - packages/devkit/README.md
  - packages/devkit/ARCHITECTURE.md
  - pnpm-workspace.yaml
started: 2026-08-20
updated: 2026-08-20
plan: (none)
pr: '#845'
issue: #797
---

## What

Enforce a skill's declared gate-runtime version range

## Status / next

- Current step: `peer:` gate implemented — the frontmatter reader, `peer.mjs`,
  the fold into `planSync`'s existing `unmet` state, and one peer resolution per
  plan in `buildPlan`. Verification passed; its one low finding (a README example
  range this tree cannot satisfy) is fixed
- Blockers: none
- Next: PR #845 awaiting its owner
