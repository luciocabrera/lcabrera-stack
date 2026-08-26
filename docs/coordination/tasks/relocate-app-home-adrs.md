---
id: relocate-app-home-adrs
title: docs(repo): relocate the app-home ADRs whose subject now lives in packages/ui
owner: agent:claude
status: review
branch: chore/956-relocate-app-home-adrs
area:
  - docs/decisions/**
  - apps/showcase/docs/decisions/**
  - docs/agents/**
  - docs/README.md
  - AGENTS.md
  - apps/showcase/README.md
  - apps/showcase/src/**
  - devkit.config.json
  - .claude/agents/**
  - .github/skills/**
  - packages/repo-standards/scripts/**
started: 2026-08-26
updated: 2026-08-26
plan: (none)
pr: #965
issue: #956
---

## What

docs(repo): relocate the app-home ADRs whose subject now lives in packages/ui

## Status / next

- Current step: 11 package-subject ADRs moved to docs/decisions/; both app-only
  ADRs deleted and the app ADR home closed; ~5,000 lines of duplicate app docs
  removed. Gates green, duplicate gate re-proven with a planted ADR-005.
- Blockers: none
- Next: full check:safe, then review and merge. #955 is the last epic child.
