---
id: sonar-reporting
title: SonarCloud findings → tracked report + local gate (sonar:report/verify)
owner: agent:claude
status: review
branch: chore/biome-linter-hardening
area:
  - scripts/sonar-report.mjs
  - reports/sonar/**
started: 2026-07-18
updated: 2026-07-18
plan: (none)
pr: 31
---

## What

SonarCloud runs here in **Automatic Analysis** mode (no scanner in the repo — the
GitHub App analyses each push server-side), so there is nothing local to run and
no findings on disk. This work adds the missing bridge: a root script
(`sonar:report` / `sonar:verify`) that pulls issues + hotspots + the quality gate
from the SonarCloud Web API into a tracked `reports/sonar/full-latest.json` —
mirroring the existing `reports/{oxlint,eslint,biome,fallow}` convention — so
agents and CI can act on Sonar from a file, not the dashboard.

Shares `chore/biome-linter-hardening` with the Biome-hardening work — see
[branches/chore-biome-linter-hardening.md](../branches/chore-biome-linter-hardening.md).
Non-overlapping areas: this task owns `scripts/sonar-report.mjs` + `reports/sonar/**`;
the Biome work owns `biome.jsonc` + ADR-035.

## Status / next

- Current step: **landed + pushed** to `chore/biome-linter-hardening` (PR #31) —
  script, docs, `.env.example`, tracked `reports/sonar/full-latest.json`. Report
  is deterministic (byte-stable across runs); `reports/sonar/` is fmt-ignored so
  the generator and Oxfmt don't fight.
- Blockers: none locally. CI enforcement (a `sonar:verify` gate step) needs the
  user to add `SONAR_TOKEN` as a GitHub Actions secret first — teed up, not wired.
- Next (needs the user): (1) add `SONAR_TOKEN` repo secret; (2) tighten the
  SonarCloud quality gate + make the check required; then (3) wire the CI gate step.
