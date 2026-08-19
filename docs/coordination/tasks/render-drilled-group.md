---
id: render-drilled-group
title: Render a drilled group and hand off beyond one page
owner: agent:claude
status: review
branch: feat/777-render-drilled-group
area:
  - packages/ui/src/components/Table/**
  - packages/api/src/olap/**
  - packages/server/src/db/olap/**
  - apps/react-router/src/routes/enterprise-orders/**
  - apps/react-router/src/routes/api/enterprise-orders-drill/**
  - docs/decisions/ADR-081-*
started: 2026-08-18
updated: 2026-08-19
plan: (none)
pr: #796
issue: #777
---

## What

Render a drilled group and hand off beyond one page.

Widened 2026-08-19: the OLAP seam (drill translation, the `GROUPING()` mask
decode, the wire codec) is a Table feature, not an app one, and was written into
`apps/react-router`. It moves into the packages under ADR-081 before the
rendering half is finished, because the drill action hook has to build the
request param and can only import a codec that lives in a package.

## Status / next

- Current step: drill is end to end — chrome, action, hand-off, a11y, app wiring
- Blockers: none
- Next: retitle PR #796 off the claim title and mark it ready for review
