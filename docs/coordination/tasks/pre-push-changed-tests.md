---
id: pre-push-changed-tests
title: Pre-push runs tests for changed workspaces
owner: agent:claude
status: review
branch: pre-push-changed-tests
area:
  - .vite-hooks/pre-push
  - COMMANDS.md
  - .claude/README.md
started: 2026-07-21
updated: 2026-07-21
plan: (none)
pr: (none)
issue: #130
---

## What

Pre-push runs tests for changed workspaces

## Status / next

- Current step: in review — gate green; selection probed in all three modes
- Blockers: none
- Next: merge. Also retires the merged sonar-report-freshness claim.
