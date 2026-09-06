---
id: gates-as-bins
title: expose the gates as bins and drop the root wrappers
owner: agent:claude
status: review
branch: refactor/1072-gates-as-bins
area:
  - scripts/*.mjs
  - scripts/*.cjs
  - scripts/changed-files.sh
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
  - docs/tooling/coverage-reporting.md
  - .github/skills/fallow-code-checker/CONFIGURATION.md
started: 2026-09-06
updated: 2026-09-06
plan: (none)
pr: #1099
issue: #1072
---

## What

expose the gates as bins and drop the root wrappers

## Status / next

- Current step: round 2 — the coverage tasks feed `--changed` on stdin again,
  and the review threads on #1099 are answered
- Blockers: none
- Next: verifier round; `#1096` (the TypeScript port) runs as its own claim
  immediately after this one merges, so this issue moves the files as `.mjs`
  and keeps "existing tests pass unmodified" literal
- Coordination: `packages/devkit/CLASSIFICATION.md` overlapped the claim
  `devkit-profile-ladder` (#1073), now merged. This task edits only the "Root
  scripts" section; the rebase onto #1073 kept both sides
- Not done here, by design: `packages/devkit/scripts/init.mjs` (`GATE_TASKS`)
  belongs to #1073; the consumer tasks for the new bins are #1077; the three
  shell scripts are #1100
