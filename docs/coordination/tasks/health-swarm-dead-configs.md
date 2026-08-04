---
id: health-swarm-dead-configs
title: Delete every dead lint/format config and gate their return
owner: agent:claude
status: review
branch: chore/518-delete-dead-lint-format-configs
area:
  - .oxfmtrc.json
  - .prettierrc*
  - .prettierignore
  - .eslintignore
  - .claudelintignore
  - apps/react-router/.oxfmtrc.json
  - apps/react-router/.prettier*
  - scripts/verify-stray-configs.mjs
  - scripts/lib/stray-configs*.mjs
started: 2026-08-04
updated: 2026-08-04
plan: (none)
pr: (none)
issue: https://github.com/luciocabrera/vite-react-compiler/issues/518
---

## What

Deletes the eight formatter/linter config files no engine reads, and adds
`vp run configs:verify` so they cannot come back. Covers the root four from
#517 and the workspace-level twins from #518 — one family, one PR, because
PR #420 deleted the `miscelanious` directory and left every ignore file that
named it.

## Status / next

- Current step: quality gate
- Blockers: none
- Next: open PR against main
