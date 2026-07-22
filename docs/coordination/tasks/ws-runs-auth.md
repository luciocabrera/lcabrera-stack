---
id: ws-runs-auth
title: Authenticate the /ws/runs WebSocket
owner: agent:claude
status: review
branch: ws-runs-auth
area:
  - packages/server/src/tickets/**
  - apps/scan-orchestrator/src/ws/**
  - apps/scan-orchestrator/src/config/env.schema.ts
  - apps/scan-orchestrator/src/server.ts
  - apps/admin_system/src/auth/createRunStatusTicket.service.ts
  - apps/admin_system/src/auth/wsTicketEnv.schema.ts
  - apps/admin_system/src/hooks/useRunStatusSocket.hook.ts
  - apps/admin_system/src/routes/cqms/run-detail/**
started: 2026-07-21
updated: 2026-07-21
plan: (none)
pr: #251
issue: #66
---

## What

Close STATUS.md §3.3 — `/ws/runs` accepted any subscribe message carrying a
well-formed run uuid, which is a capability check in name only (a run id is
unguessable, not secret: it sits in the page URL, in loader payloads and in
logs).

Subscribing now requires a short-lived, run-scoped HMAC ticket minted by
`apps/admin_system`'s run-detail loader, behind its existing session gate.
The design and the rejected alternatives are in ADR-041.

The `apps/scan-orchestrator/**` glob was deliberately narrowed to the files
this task actually owns, so it stops overlapping `sonar-main-vulnerabilities`,
which owns `src/queue/runQueuedScan.ts`.

## Status / next

- Implementation, tests and docs complete; the gate is green.
- Awaiting review on #251.
