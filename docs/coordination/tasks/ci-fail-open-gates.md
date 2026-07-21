---
id: ci-fail-open-gates
title: 'fix(ci): stop required gates passing green without checking anything'
owner: agent:claude
status: active
branch: fix/ci-fail-open-gates
area:
  - scripts/changed-files.sh
  - scripts/sonar-report.mjs
  - .github/workflows/check-safe.yml
  - .github/workflows/sonar-issue-gate.yml
  - package.json
started: 2026-07-21
updated: 2026-07-21
plan: (none)
pr: (none)
issue: #174
---

## What

Three fail-open paths let a required status check report success without
verifying anything:

- an unresolved `git merge-base` made every changed-files gate select zero
  files and exit 0 (six call sites, inside two required checks)
- the strict Sonar gate exits 0 when `SONAR_TOKEN` is absent, including on
  same-repo PRs where the secret should exist
- `check:safe` omitted the three verifiers that CI runs, while the docs
  described it as CI parity

## Status / next

- Current step: implemented and verified locally
- Blockers: none
- Next: open the PR
