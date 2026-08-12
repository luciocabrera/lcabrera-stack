---
id: promote-sort-adapter
title: Promote the request-sort → QuerySort adapter into @lcabrera/server
owner: agent:claude
status: review
branch: refactor/605-promote-sort-adapter
area:
  - packages/server/src/sort/**
  - apps/shared/src/**
started: 2026-08-12
updated: 2026-08-12
plan: (none)
pr: 606
issue: #605
---

## What

Promote the request-sort → QuerySort adapter into @lcabrera/server

## Status / next

- Current step: PR #606 ready for review; full quality gate green
- Blockers: none
- Next: review + merge, then delete this file. Follow-up filed as #608 (the
  enterprise-orders paginated resource route can still serve unordered pages).
