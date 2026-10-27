---
id: fix-server-pool-idle-error
title: Keep the pool from stopping the process when an idle connection fails
owner: agent:claude
status: active
branch: fix/1523-fix-server-pool-idle-error
area:
  - packages/server/src/db/get-pool.util*
  - packages/server/README.md
  - packages/server/src/INVENTORY.md
  - .changeset/*pool*
started: 2026-10-27
updated: 2026-10-27
plan: (none)
pr: (none)
issue: #1523
---

## What

Keep the pool from stopping the process when an idle connection fails

## Status / next

- Current step: just claimed
- Blockers: none
- Next:
