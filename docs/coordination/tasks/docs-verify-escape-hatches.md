---
id: docs-verify-escape-hatches
title: Narrow the documented-path gate's escape hatches to one reference at a time
owner: agent:claude
status: active
branch: fix/docs-verify-escape-hatches
area:
  - scripts/verify-docs-paths.mjs
  - scripts/lib/docs-paths-baseline.mjs
  - scripts/docs-paths-baseline.json
started: 2026-07-21
updated: 2026-07-21
plan: (none)
pr: (none)
issue: #206
---

## What

Review follow-up to #198/#201. Every escape hatch the gate offered was
all-or-nothing: `IGNORED_DOCS` stops checking a whole document, and `--write`
absorbed every current failure. The failure message recommended the wider of the
two.

`--write` is now prune-only, the baseline carries a required reason per
reference, `--accept` grandfathers exactly one, and the worktree skip generalised
from a hard-coded path to "this directory is a separate checkout".

## Status / next

- Current step: implemented; behaviour matrix verified; baseline emptied because
  four of its five entries were real broken links and the fifth was a doc
  inconsistency.
- Blockers: none.
- Next: quality gate, then PR.
