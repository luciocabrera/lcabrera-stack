---
id: fallow-tooling-trees
title: prove every fallow check fires, including over the tooling trees
owner: agent:claude
status: active
branch: test/1095-fallow-tooling-trees
area:
  - .fallowrc.json
  - .github/skills/fallow-code-checker/CONFIGURATION.md
  - .github/workflows/check-safe.yml
  - reports/fallow/baselines/*.json
  - scripts/lib/fallow-entries.mjs
  - scripts/lib/fallow-entries.test.mjs
  - docs/agents/react-doctor-facts.json
started: 2026-09-06
updated: 2026-09-06
plan: (none)
pr: #1097
issue: #1095
---

## What

prove every fallow check fires, including over the tooling trees

## Status / next

- Current step: entries named, severities raised, probes recorded, gate running
- Blockers: none
- Next: push, PR body with the plant evidence and the unblinded findings
