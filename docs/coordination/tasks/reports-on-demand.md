---
id: reports-on-demand
title: Produce findings reports on demand; keep only gate baselines tracked
owner: agent:claude
status: review
branch: chore/415-reports-on-demand
area:
  - reports/**
  - .gitignore
  - scripts/lib/sonar-report-path*
  - scripts/sonar-report.mjs
started: 2026-07-25
updated: 2026-07-25
plan: (none)
pr: '#416'
issue: #415
---

## What

`reports/` mixed two jobs under one convention: gate baselines a check diffs
against, and findings snapshots nothing compares against. The snapshots were
5.7 MB of committed measurements that only moved when someone remembered — and
the Sonar one was wrong for 22 merges (#304).

- A gate compares against it → tracked (`api-surface/`, `fallow/baselines/`).
  It reports what a tool found → produced on demand, gitignored.
- The Sonar tracked-snapshot machinery is removed rather than adjusted: every
  target writes its own file under `runs/`, so a pull request's analysis being
  read as `main`'s is impossible instead of guarded.
- `docs:verify` learns these paths are expected to be absent, matched by shape
  one level below the tool directory so the baselines are not exempted.

Recorded as `docs/decisions/ADR-049-findings-reports-are-produced-on-demand.md`.

## Status / next

- Current step: gate green, PR #416 out of draft.
- Blockers: none.
- Next: delete this file when #416 merges.
