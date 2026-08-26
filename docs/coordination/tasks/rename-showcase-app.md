---
id: rename-showcase-app
title: rename the showcase app to apps/showcase
owner: agent:claude
status: review
branch: chore/951-rename-showcase-app
area:
  - apps/showcase/**
  - packages/ts-configs/**
  - packages/repo-standards/**
  - packages/eslint-local-rules/**
  - scripts/**
  - docs/**
  - .claude/**
  - .github/**
  - reports/fallow/baselines/**
  - COMMANDS.md
  - README.md
  - AGENTS.md
  - biome.jsonc
  - vite.config.ts
  - devkit.config.json
  - .sonarcloud.properties
  - .fallowrc.json
started: 2026-08-26
updated: 2026-08-26
plan: (none)
pr: #961
issue: #951
---

## What

rename the showcase app to apps/showcase

## Status / next

- Current step: in review — `check:safe` green, DB route returns real rows
- Blockers: none
- Next: address review, merge, then #953 (sweep the stale agent memory) unblocks
