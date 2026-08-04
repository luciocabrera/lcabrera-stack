---
id: health-swarm-react-probe
title: Probe the react Oxlint family and gate PLUGINS coverage
owner: agent:claude
status: review
branch: chore/517-probe-react-oxlint-family
area:
  - scripts/lib/lint-plugins.mjs
  - scripts/lib/lint-plugins.test.mjs
  - scripts/verify-lint-plugins.mjs
started: 2026-08-04
updated: 2026-08-04
plan: (none)
pr: (none)
issue: https://github.com/luciocabrera/vite-react-compiler/issues/517
---

## What

Adds the missing `react` probe to `lint:plugins:verify` and a coverage check so
a family cannot be added to `PLUGINS` and left unproven.

## Status / next

- Current step: quality gate
- Blockers: none
- Next: open PR against main
