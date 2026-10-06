---
id: eval-reporting-views
title: Add reporting views, the reader role and a 15k-trial fixture
owner: agent:claude
status: review
branch: feat/1276-eval-reporting-views
area:
  - packages/eval-history/migrations/**
  - packages/eval-history/src/queries/**
  - packages/eval-history/src/seed/**
  - packages/eval-history/src/migrate/**
  - packages/eval-history/scripts/**
  - packages/eval-history/package.json
  - packages/eval-history/README.md
  - COMMANDS.md
started: 2026-10-06
updated: 2026-10-06
plan: (none)
pr: '#1350'
issue: #1276
---

## What

Add reporting views, the reader role and a 15k-trial fixture

## Status / next

- Current step: built and gated; PR ready for review
- Blockers: stacked on feat/1344-evals-prices-and-writer-grants (#1346), which adds the role grants this extends
- Next: merge after #1346
