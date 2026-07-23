---
id: filter-options-loader-transport
title: Route enterprise-orders filter options through the same-origin loader transport
owner: agent:claude
status: review
branch: fix/340-filter-options-loader-transport
area:
  - apps/react-router/src/routes/enterprise-orders/**
started: 2026-07-23
updated: 2026-07-23
plan: (none)
pr: 341
issue: #340
---

## What

Distinct filter options (Customer, Email, …) failed in the production build with
a CORS error because the enterprise-orders descriptors used `transport: 'bff'`
(browser → api-server `:3001` directly). Switch to `transport: 'loader'` so
options fetch same-origin through `/_api/filter-options` — the same model the
rows already use. One-parameter change through the existing
`appendDistinctFilterDescriptors` util; `bff` stays a supported, unit-covered
transport.

## Status / next

- Current step: PR #341 open, live-verified; ready for review
- Blockers: none
- Next: merge; auth-guard follow-up filed as #342
