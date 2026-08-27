---
id: product-requirements-register
title: State the product requirements as a checkable register
owner: agent:claude
status: review
branch: docs/986-product-requirements-register
area:
  - docs/product/**
  - docs/decisions/ADR-*.md
  - docs/README.md
started: 2026-08-27
updated: 2026-08-27
plan: (none)
pr: #1006
issue: #986
---

## What

`docs/product/` — the register of what the packages must let a consumer do:
a README stating what the layer is canonical for, a VISION naming the two
product lines and three personas, a template, the seed requirements, and
ADR-093 recording why a requirement's state is declared rather than derived.
Two routing rows in `docs/README.md`.

## Status / next

- Current step: gate run, PR #1006 open
- Blockers: none
- Next: merge. Overlaps #987 on `docs/README.md` only, in regions ~130 lines
  apart (epic #985 orchestration plan, finding 1)
