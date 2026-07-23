---
id: 331-gvs-decline
title: ADR-044 — record the evaluated decline of pnpm enableGlobalVirtualStore
owner: agent:claude
status: review
branch: docs/331-decline-global-virtual-store
area:
  - docs/cqms/decisions/ADR-044-decline-pnpm-global-virtual-store.md
  - pnpm-workspace.yaml
started: 2026-07-23
updated: 2026-07-23
plan: (none)
pr: '#343'
issue: #331
---

## What

Record the outcome of the `enableGlobalVirtualStore` spike (#331) as ADR-044:
evaluated, declined because pnpm's experimental global virtual store does not link
rolldown's platform-specific native binding, breaking every `vp` command. Adds a
one-line pointer in `pnpm-workspace.yaml` at the point of use.

## Status / next

- Current step: ADR + workspace pointer written; opening PR.
- Blockers: none.
- Next: PR review, then close #331 on merge and delete this task file.
