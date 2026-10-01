---
id: rung-supersedes-file
title: feat(devkit): a higher rung supersedes a lower rung's file
owner: agent:claude
status: review
branch: feat/1220-rung-supersedes-file
area:
  - packages/devkit/scripts/sync.mjs
  - packages/devkit/scripts/manifest.mjs
  - packages/devkit/scripts/command-sync.mjs
  - packages/devkit/scripts/command-materialise.mjs
  - packages/devkit/scripts/config.mjs
  - packages/devkit/scripts/sync*.test.mjs
  - packages/devkit/scripts/manifest*.test.mjs
  - packages/devkit/CLASSIFICATION.md
  - packages/devkit/README.md
  - docs/decisions/ADR-*-higher-rung*
  - .changeset/rung-supersedes*.md
  - reports/api-surface/devkit.txt
  - packages/devkit/scripts/retirement.mjs
  - packages/devkit/scripts/command-init.mjs
  - packages/devkit/ARCHITECTURE.md
started: 2026-10-01
updated: 2026-10-01
plan: (none)
pr: '#1225'
issue: #1220
---

## What

feat(devkit): a higher rung supersedes a lower rung's file

## Status / next

- Current step: in review on #1225; round 2 adds the containment and asset-set guards on retirement
- Blockers: none
- Next:
