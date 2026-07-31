---
id: separated-type-imports
title: Enforce separated type imports repo-wide
owner: agent:claude
status: blocked
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

- Current step: **blocked on #468 (react-doctor-sweep)** — deliberately not started.
- Blockers: the sweep is repo-wide by nature, and 32 of the 50 mixed imports fall
  inside `react-doctor-sweep`'s claimed area (`packages/ui/**`,
  `apps/admin_system/**`). That task has commits in flight touching several of the
  same files, so landing a mechanical import rewrite now would hand it an
  import-block conflict across most of its diff.
- Why not narrow instead: a partial sweep cannot enable the rule at `error` — the
  unfixed files would fail it — so it would be churn with no enforcement. Scope
  reduction does not work here; sequencing does.
- Next: once #468 merges, rebase onto main, set the rule, run
  `biome lint . --write`, then the eslint pass (perfectionist owns import order,
  so it may reposition the inserted statements), then the full gate.
