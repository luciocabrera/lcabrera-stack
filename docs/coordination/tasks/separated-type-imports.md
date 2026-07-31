---
id: separated-type-imports
title: Enforce separated type imports repo-wide
owner: agent:claude
status: review
branch: refactor/474-separated-type-imports
area:
  - biome.jsonc
  - apps/**/*.ts
  - packages/**/*.ts
started: 2026-07-31
updated: 2026-07-31
plan: (none)
pr: #475
issue: #474
---

## What

Enforce separated type imports repo-wide.

Pin Biome's `useImportType` at `error` with `options.style: "separatedType"`, then
apply its safe autofix. Today the rule runs at its default `warn` with
`style: "auto"`, and `auto` explicitly permits `import { type T, V }` — which is
why the mixed form passes every gate.

## Status / next

- Current step: in review — the sweep is applied and the gate is green.
- Was blocked on #468 (react-doctor-sweep) until PR #469 merged; serialising was
  the resolution, since narrowing could not work (a partial sweep cannot enable
  the rule at `error` without the unfixed files failing it).
- One thing to know before touching this again: Biome's autofix mishandles a
  **default** import sharing a statement with a named type — it made
  `import express, { type Express, Router }` into `import type express`, which is
  a runtime binding. One occurrence, fixed by hand; see the PR.
- Next: merge, then delete this file.
