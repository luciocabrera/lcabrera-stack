---
id: ui-client-safety-guard-scans
title: Make the ui client-safety guard scan its real workspace dependencies
owner: agent:claude
status: review
branch: fix/1010-ui-client-safety-guard-scans
area:
  - packages/ui/scripts/**
  - packages/ui/package.json
  - .fallowrc.json
  - docs/product/requirements/the-ui-package-stays-client-safe.md
  - .github/skills/unslop/SKILL.md
started: 2026-08-30
updated: 2026-08-30
plan: (none)
pr: 1036
issue: #1010
---

## What

Fix #1010: `packages/ui`'s client-safety guard selected its dependency closure by
a `@repo/` name prefix and placed each package by string substitution, so after
the npm scope rename it scanned nothing and printed PASS. Selection and
placement now come from the workspace roster, and a scan that opened no file is
reported as a defect instead of a clean run. Review round 2 widened the walk to
the whole dependency closure — the packages a dependency declares, to any depth —
and narrowed what it reads to the source each package publishes, so a colocated
test no install receives is no longer a violation.

Carries one change outside the issue, at the repository owner's request: a
one-line edit to `.github/skills/unslop/SKILL.md`.

## Status / next

- Current step: round 2 — both review threads addressed, gate re-run
- Blockers: none
- Next: verification
