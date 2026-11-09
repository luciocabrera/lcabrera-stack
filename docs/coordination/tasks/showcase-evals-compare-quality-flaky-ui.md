---
id: showcase-evals-compare-quality-flaky-ui
title: refactor(showcase): move the compare, quality and flaky pages onto @lcabrera/ui
owner: agent:claude
status: review
branch: refactor/1564-showcase-evals-compare-quality-flaky-ui
area:
  - apps/showcase/src/routes/evals/compare/**
  - apps/showcase/src/routes/evals/quality/**
  - apps/showcase/src/routes/evals/flaky/**
  - apps/showcase/e2e/evals/quality.spec.ts
  - packages/ui/src/components/Breadcrumbs/**
  - packages/ui/src/components/Table/TableHeaderCell/**
  - packages/ui/src/components/Table/Table.staticLayout.test.tsx
started: 2026-11-09
updated: 2026-11-09
plan: (none)
pr: '#1609'
issue: #1564
---

## What

refactor(showcase): move the compare, quality and flaky pages onto @lcabrera/ui

## Status / next

- Current step: built and gated; PR #1609 open for review
- Blockers: none
- Next: once #1610 merges, swap the flaky split tone onto the badge, then verifier
