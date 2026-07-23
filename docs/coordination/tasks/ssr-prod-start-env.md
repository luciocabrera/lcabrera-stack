---
id: ssr-prod-start-env
title: Load DB env vars in the SSR apps' production start task
owner: agent:claude
status: review
branch: fix/329-ssr-prod-start-env
area:
  - packages/vite-configs/vite.run.shared.config.ts
  - packages/vite-configs/vite.run.shared.config.test.ts
started: 2026-07-23
updated: 2026-07-23
plan: (none)
pr: (none)
issue: #329
---

## What

The shared `start` task (`createReactRouterRunConfig`, used by both the
react-router and admin_system apps) launched `react-router-serve` with no
environment loaded, so the production build threw a `ZodError` the first time a
loader opened a Postgres connection. Prepend the same env load the `dev` scripts
use, forgiving of a missing file and CR-stripped, then serve.

## Status / next

- Current step: fix + regression test done and green; opening PR against #329
- Blockers: none
- Next: merge once reviewed, then delete this file
