---
id: api-server-fast-shutdown-signals
title: fix(api-server-fast): adopt @repo/node-runtime, unhandled SIGTERM
owner: agent:claude
status: active
branch: fix/api-server-fast-shutdown-signals
area:
  - apps/api-server-fast/src/server.ts
  - apps/api-server-fast/src/errors/**
  - apps/api-server-fast/package.json
started: 2026-07-21
updated: 2026-07-21
plan: (none)
pr: (none)
issue: #147
---

## What

`apps/api-server-fast` wires its own shutdown handler and registers only
`SIGINT`. `SIGTERM` — what `docker stop` and orchestrator eviction actually
send — is unhandled, so the process is killed before `app.close()` and
`pool.end()` run. Its sibling `apps/api-server` already uses
`registerShutdownSignals` from `@repo/node-runtime`, which handles both.

Also removes an orphaned local `HttpError` copy (nothing imports it; every
consumer already resolves it from `api-shared`).

Surfaced while evaluating `@repo/node-runtime` under epic #140.

## Status / next

- Current step: applying the fix
- Blockers: none
- Next: verify with a real `kill -TERM`, then the quality gate
