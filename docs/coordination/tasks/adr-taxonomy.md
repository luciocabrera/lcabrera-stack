---
id: adr-taxonomy
title: Split the ADR sequence by tier and enforce one home per tier
owner: agent:claude
status: review
branch: docs/387-adr-taxonomy
area:
  - docs/decisions/**
  - docs/cqms/decisions/**
  - docs/agents/**
  - scripts/verify-adrs.mjs
  - scripts/lib/adr-*
started: 2026-07-25
updated: 2026-07-25
plan: (none)
pr: '#388'
issue: #387
---

## What

ADRs had accumulated in four directories with no rule saying which one a new
decision belonged in, and nothing checked any of it — `docs:verify` skips every
`decisions` directory on purpose. `ADR-047` already meant two documents.

- Three homes, chosen by **one** question: when CQMS is extracted, does this
  decision go with it? 20 repo/package/tooling ADRs moved to `docs/decisions/`;
  27 CQMS ones stayed; the 12 app ones were already right.
- One global number sequence. The 001–012 overlap is grandfathered, not
  renumbered — an ADR is a dated record.
- Drafts hold no number; one is assigned at adoption.
- `vp run adr:verify` enforces home, filename, heading, uniqueness and index
  freshness, and prints the next free number.

Taxonomy recorded in `docs/decisions/ADR-048-adr-taxonomy-and-one-sequence.md`.

## Status / next

- Current step: gate green, PR #388 out of draft.
- Blockers: none.
- Next: delete this file when #388 merges.
