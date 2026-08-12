---
id: docs-server-filter-edge
title: Correct the ui/server filter edge claims in the server docs
owner: agent:claude
status: review
branch: chore/556-docs-server-filter-edge
area:
  - packages/server/src/filters/ARCHITECTURE.md
  - packages/server/src/INVENTORY.md
started: 2026-08-12
updated: 2026-08-12
plan: (none)
pr: https://github.com/luciocabrera/vite-react-compiler/pull/636
issue: #556
---

## What

`packages/server/src/filters/ARCHITECTURE.md` claimed `@lcabrera/ui` depends on
`@lcabrera/server` and that its `types/filterOperators.types` re-exports these
shapes; `packages/server/src/INVENTORY.md` repeated the re-export claim. Both
describe an edge that does not exist and must not exist (ADR-038). Replaced with
the real topology: independent declarations on each side, duplicated on purpose
(ADR-039), held in step by the conformance test in `apps/react-router`.

Documentation only — no source, manifest or export-surface change.

## Status / next

- Current step: gate green, pushed, PR left as a draft for review
- Blockers: none
- Next: verification
