---
id: evals-regression-e2e
title: Pin the evals pages with regression e2e specs on a fixed seed
owner: agent:claude
status: review
branch: test/1551-evals-regression-e2e
area:
  - apps/showcase/e2e/evals/**
  - apps/showcase/e2e/global-setup.ts
  - apps/showcase/playwright.config.ts
  - .github/workflows/e2e.yml
  - COMMANDS.md
started: 2026-10-30
updated: 2026-11-02
plan: (none)
pr: '#1579'
issue: #1551
---

## What

Pin the evals pages with regression e2e specs on a fixed seed

## Status / next

- Current step: in review on #1579; the specs, the fixed seed and the three
  servers are in, and every review thread so far is answered
- Blockers: none
- Next: merge, then #1564–#1566 run these specs unchanged
