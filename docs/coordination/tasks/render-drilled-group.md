---
id: render-drilled-group
title: Render a drilled group and hand off beyond one page
owner: agent:claude
status: active
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

- Current step: OLAP seam promoted (ADR-081); back on the rendering half
- Blockers: none
- Next: the visible drill chrome, the drill action hook, the hand-off href,
  discard-on-refetch, the a11y sweep, then wire `isGroupDrillEnabled`
