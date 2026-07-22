---
id: coverage-lint-rules-agent-runner
title: Report agent-runner and eslint-local-rules coverage
owner: agent:claude
status: review
branch: ci/302-coverage-lint-rules-agent-runner
area:
  - scripts/lib/coverage-workspaces.mjs
  - packages/agent-runner/vite.config.ts
  - packages/eslint-local-rules/vite.config.ts
  - docs/tooling/coverage-reporting.md
started: 2026-07-22
updated: 2026-07-22
plan: (none)
pr: (none)
issue: #302
---

## What

`packages/eslint-local-rules` (138 tests) and `packages/agent-runner` (57) run in
CI unmeasured — both were written off in the docs as having nothing to cover,
which stopped being true when #205 gave every rule a suite. Adds a
`test:coverage` task to each, both report rows, and corrects the doc.

Also drops `--passWithNoTests` from `eslint-local-rules`' `test` task: with ten
files it only meant the suite vanishing would still report success.

## Status / next

- Current step: gate green; report renders 13 workspaces, both new rows present
- Blockers: none
- Next: merge
