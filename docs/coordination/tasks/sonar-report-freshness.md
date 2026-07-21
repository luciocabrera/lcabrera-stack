---
id: sonar-report-freshness
title: sonar:report must show how old the analysis is
owner: agent:claude
status: review
branch: sonar-report-freshness
area:
  - scripts/sonar-report.mjs
  - scripts/lib/sonar-*
started: 2026-07-21
updated: 2026-07-21
plan: (none)
pr: (none)
issue: #247
---

## What

sonar:report must show how old the analysis is

## Status / next

- Current step: in review — gate green, tests added
- Blockers: none
- Finding: running it surfaced that `main`'s gate is RED (115 issues, 12
  vulnerabilities) and that #75's plsql exclusion never took effect. Both
  reported separately; deliberately NOT fixed here.
- Next: merge
