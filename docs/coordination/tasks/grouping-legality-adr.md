---
id: grouping-legality-adr
title: Adopt the grouping-legality decision as an ADR (role gate + catalogue floor)
owner: agent:claude
status: active
branch: docs/552-grouping-legality-adr
area:
  - docs/decisions/**
  - docs/agents/planning/**
started: 2026-08-11
updated: 2026-08-11
plan: (none)
pr: (none)
issue: 552
---

## What

Move `adr-drafts/grouping-legality-from-the-catalog.md` into `docs/decisions/`
under the next free number, carrying the two-gate model (analytical role as the
bar, the Postgres catalogue as the floor) rather than the draft's original
catalogue-is-authoritative framing. Re-point the planning documents at the
adopted decision.

Unblocks #563, which implements the resolver.

## Status / next

- Current step: writing the ADR
- Blockers: none
- Next: `adr:verify --write`, `docs:verify`, full gate, PR
