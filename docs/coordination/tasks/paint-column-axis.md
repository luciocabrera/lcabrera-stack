---
id: paint-column-axis
title: Paint a grouped read's column axis as ordinary columns
owner: agent:claude
status: review
branch: feat/1170-paint-column-axis
area:
  - packages/ui/src/utils/urlState/**
  - packages/ui/src/routing/**
  - packages/ui/src/components/Table/**
  - packages/ui/src/INVENTORY.md
  - packages/ui/src/PATTERNS.md
  - packages/server/src/db/olap/**
  - packages/server/src/INVENTORY.md
  - apps/showcase/src/routes/enterprise-orders/**
  - .changeset/**
  - docs/decisions/**
  - docs/product/requirements/**
  - reports/api-surface/**
started: 2026-09-10
updated: 2026-09-10
plan: (none)
pr: #1171
issue: #1170
---

## What

Paint a grouped read's column axis as ordinary columns.

## Status / next

- Current step: addressing PR #1171 review threads (drawer seed, emitted keys, production paint sync)
- Blockers: none
- Next: push, resolve threads; do not merge from this agent
