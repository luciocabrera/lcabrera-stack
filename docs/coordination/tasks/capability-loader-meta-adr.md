---
id: capability-loader-meta-adr
title: docs(adr): a table capability is declared once, on the loader meta
owner: agent:claude
status: review
branch: docs/555-capability-loader-meta-adr
area:
  - docs/decisions/ADR-063-*
  - docs/agents/planning/adr-drafts/one-capability-declaration-on-the-loader-meta.md
started: 2026-08-12
updated: 2026-08-12
plan: (none)
pr: '#626'
issue: #555
---

## What

docs(adr): a table capability is declared once, on the loader meta

## Status / next

- Current step: ADR-063 written, index regenerated, draft removed; gates green
  (`vp fmt .`, `vp run adr:verify`, `vp run docs:verify`, `vp check`).
- Blockers: none
- Next: orchestrator resolves the ADR index against the sibling ADRs on other
  branches, then reviews and merges #626.
