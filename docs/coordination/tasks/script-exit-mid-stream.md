---
id: script-exit-mid-stream
title: Stop scripts exiting mid-stream and gate it
owner: agent:claude
status: review
branch: chore/929-script-exit-mid-stream
area:
  - scripts/verify-script-exits.mjs
  - scripts/lib/script-exit-calls*
  - scripts/lib/deps-refresh-pin-drift.test.mjs
  - scripts/verify-eslint-pass.mjs
  - scripts/verify-react-doctor.mjs
  - scripts/validate-skills.cjs
  - scripts/generate-skills-compliance-report.cjs
  - scripts/refresh-fallow-complexity-report.cjs
  - packages/scan-report/scripts/generate-fallow-report.mjs
  - .github/skills/app-graph/scripts/**
  - apps/react-router/scripts/**
  - .claude/rules/scripts.md
  - COMMANDS.md
  - package.json
started: 2026-08-25
updated: 2026-08-25
plan: (none)
pr: #930
issue: #929
---

## What

Stop scripts exiting mid-stream and gate it

## Status / next

- Current step: 11 sites fixed, gate added and wired, in review
- Blockers: none
- Next:
