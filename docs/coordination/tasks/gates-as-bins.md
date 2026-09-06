---
id: gates-as-bins
title: expose the gates as bins and drop the root wrappers
owner: agent:claude
status: review
branch: refactor/1072-gates-as-bins
area:
  - scripts/*.mjs
  - scripts/*.cjs
  - scripts/lib/**
  - scripts/script-size-baseline.json
  - packages/repo-standards/**
  - package.json
  - COMMANDS.md
  - .github/workflows/*.yml
  - .fallowrc.json
  - reports/api-surface/repo-standards.txt
  - .changeset/gates-as-bins.md
  - packages/devkit/CLASSIFICATION.md
started: 2026-09-06
updated: 2026-09-06
plan: (none)
pr: #1099
issue: #1072
---

## What

expose the gates as bins and drop the root wrappers

## Status / next

- Current step: gate green locally, pushed for verification
- Blockers: none
- Next: verifier round; `#1096` (the TypeScript port) runs as its own claim
  immediately after this one merges, so this issue moves the files as `.mjs`
  and keeps "existing tests pass unmodified" literal
- Coordination: `packages/devkit/CLASSIFICATION.md` overlaps the live claim
  `devkit-profile-ladder` (#1073). The overlap is coordinated: this task edits
  only its "Root scripts" section; #1073 edits the "profile ladder" section
- Not done here, by design: `packages/devkit/scripts/init.mjs` (`GATE_TASKS`)
  belongs to #1073; the consumer tasks for the new bins are #1077; the three
  shell scripts are #1100
