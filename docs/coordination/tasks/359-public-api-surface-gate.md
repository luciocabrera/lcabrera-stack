---
id: 359-public-api-surface-gate
title: Detect breaking changes to the public package API surface (attw + surface snapshot gate)
owner: agent:claude
status: active
branch: claude/issue-359-orchestration-024ed0
area:
  - scripts/verify-api-surface.mjs
  - scripts/verify-attw.mjs
  - scripts/lib/api-surface-*.mjs
  - scripts/lib/attw-*.mjs
  - reports/api-surface/**
started: 2026-07-24
updated: 2026-07-24
plan: (none)
pr: (none)
issue: #359
---

## What

A CI gate that mechanically detects changes to the **published API surface** of
the four `@lcabrera/*` packages (`ui`, `api`, `server`, `utils`) and refuses a
silent break — the missing "contract" half of "apps-as-harness" (issue #359).

Two complementary layers:

- **Surface snapshot** — a tracked, deterministic golden file per public package
  (from `dist` `.d.mts` for the three built packages, `src` for source-shipped
  `ui`); a `verify` + `--write` script; CI fails on un-regenerated drift and
  lists every added/removed/changed export; a surface change is cross-checked
  against the presence of a changeset for that package (additive vs breaking).
- **attw** — `@arethetypeswrong/core` over the three built packages, catching
  published types that don't resolve for consumers.

## Status / next

- Current step: implemented. `api-surface:verify` (+ `--write`) and `attw:verify`
  scripts + pure libs + unit tests; snapshots generated for all four packages;
  wired into `check-safe.yml` and `check:safe`; COMMANDS.md, ADR-046 and AGENTS.md
  updated; `@arethetypeswrong/core` added (root devDep + fallow ignore). Gate goes
  red on a simulated removed/changed export; local quality gate green (fmt, lint,
  biome, `vp check`, meta-verifies, 399 script tests, fallow audit pass).
- Blockers: none.
- Next: open the PR; move to review.
