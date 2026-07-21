---
id: remove-stop-hook
title: Remove the Stop hook; PreToolUse + PostToolUse supersede it
owner: agent:claude
status: review
branch: remove-stop-hook
area:
  - .claude/settings.json
  - .claude/README.md
started: 2026-07-21
updated: 2026-07-21
plan: (none)
pr: (none)
issue: #130
---

## What

Remove the Stop hook; PreToolUse + PostToolUse supersede it

## Status / next

- Current step: in review — PR open, gate green
- Blockers: none
- Note: removing the Stop hook drops the only LOCAL test run. Types are still
  caught pre-commit and ESLint pre-push; tests now fire first in CI.
- Next: merge; decide separately whether pre-push should run `test:ci`
