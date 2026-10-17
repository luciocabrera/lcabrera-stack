---
id: affected-tests-root-suites
title: fix(tooling): select test:evals and test:scripts when their inputs change
owner: agent:claude
status: review
branch: fix/1380-affected-tests-root-suites
area:
  - packages/repo-standards/scripts/affected-tests*
  - packages/repo-standards/scripts/test-changed.mjs
  - packages/repo-standards/scripts/config-tree-gates*
  - packages/repo-standards/README.md
  - devkit.config.json
  - COMMANDS.md
  - .changeset/select-root-suites-by-their-inputs.md
  - scripts/lib/gate-rosters.test.mjs
  - .github/skills/quality-gate-workflow/SKILL.md
  - reports/api-surface/repo-standards.txt
started: 2026-10-17
updated: 2026-10-17
plan: (none)
pr: #1388
issue: #1380
---

## What

fix(tooling): select test:evals and test:scripts when their inputs change

## Status / next

- Current step: implemented, gate run
- Blockers: none
- Next: review
