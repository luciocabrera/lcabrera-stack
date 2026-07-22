---
id: sonar-snapshot-scope
title: Stop a PR-scoped Sonar run overwriting the tracked main snapshot
owner: agent:claude
status: active
branch: fix/304-sonar-snapshot-scope
area:
  - scripts/sonar-report.mjs
  - scripts/lib/sonar-*
  - reports/sonar/**
started: 2026-07-22
updated: 2026-07-22
plan: (none)
pr: #305
issue: #304
---

## What

`sonar-report.mjs` wrote every run to `reports/sonar/full-latest.json`, so a
`--pr <n>` run replaced the tracked `main` snapshot with a pull request's. PR
#283's analysis was committed that way and read as `main`'s for 22 merges,
reporting a gate failure and two findings `main` did not have.

Splits the output path by target, restores the real `main` snapshot, and guards
the committed file's `target` field so the wrong scope cannot land again.

## Status / next

- Current step: implemented; guard proven to fail against the exact bad file
- Blockers: none
- Next: gate green, PR #305 out of draft
