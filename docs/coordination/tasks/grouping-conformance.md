---
id: grouping-conformance
title: Conformance test for the duplicated grouping shapes
owner: agent:claude
status: review
branch: chore/576-grouping-conformance
area:
  # The UI types were claimed in case a duplicated shape needed correcting;
  # none did — the drift was in what the contract test failed to name, not in
  # the declarations themselves.
  - apps/react-router/src/routes/enterprise-orders/**
started: 2026-08-20
updated: 2026-08-20
plan: (none)
pr: (none)
issue: #576
---

## What

Conformance test for the duplicated grouping shapes

## Status / next

- Current step: review
- Blockers: none

## What was already true, and what was not

The grouping contract test already pinned the aggregate, role, key-refusal,
grouping-refusal, capability, granularity and serializable-error vocabularies in
both directions, with the annotation-not-`satisfies` trap documented. Three
things were not pinned:

- **Totals placement.** `TableTotalsPlacement` claimed in its own doc comment
  that "the contract test is what holds the two spellings together" — and no
  such coverage existed. The server spells it inline on `GroupQueryDescriptor`,
  so it is reached through the field's type.
- **The grouping mode**, which is a _subset_ relation rather than an equality:
  `GroupingMode` carries `cube` and the UI deliberately does not, so asserting
  both directions would fail on an intended difference.
- **The state members themselves.** This was guaranteed only implicitly, by the
  argument types of one app service — a refactor loosening those would have
  dropped the check without touching anything named "contract".
