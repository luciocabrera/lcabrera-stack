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
- Enforcement (2026-07-18) is **two-layer**: (1) SonarCloud's native
  "SonarCloud Code Analysis" required check (ruleset on `main`, done) — but its
  gate is "Sonar way" (rating-based) and assigning a stricter custom gate is a
  **paid** feature, so it misses new code smells. (2) `.github/workflows/sonar-issue-gate.yml`
  closes that gap for free — runs `sonar-report.mjs --gate --fail-on-issues --wait`
  per PR and fails on any open issue. `--wait`/`--since` (new, + `scripts/lib/sonar-wait.mjs`)
  poll the Compute Engine so it doesn't race async Automatic Analysis.
- Next (needs the user): add the **"Strict Sonar issue gate"** check to the `main`
  ruleset's required checks after it runs once on a PR, to make layer 2 blocking.
