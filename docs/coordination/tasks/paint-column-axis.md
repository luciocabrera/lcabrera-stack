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

- Current step: independent verifier PASS on 04164f92f; PR ready for review
- Blockers: none
- Next: human review; do not merge from this agent
