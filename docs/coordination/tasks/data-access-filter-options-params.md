---
id: data-access-filter-options-params
title: Move parseFilterOptionsParams into @repo/data-access with an injected page-size default
owner: agent:claude
status: active
branch: data-access-filter-options-params
area:
  - packages/data-access/src/api/**
  - packages/data-access/package.json
  - apps/react-router/src/routes/api/filter-options/**
started: 2026-07-20
updated: 2026-07-20
plan: (none)
pr: (none)
issue: #132
---

## What

PR2b (final PR) of the util consolidation (#132). Move `parseFilterOptionsParams`
from the `react-router` filter-options route into `@repo/data-access/api`, where
it sits next to `fetchDistinctValues` (the very function it produces params for).

The move required shedding its `@repo/ui` dependency: it read
`DEFAULT_FILTER_PAGE_SIZE` from `@repo/ui/components/Table/Table.constants`, and
`@repo/data-access` (a lower layer than `@repo/ui`) must not depend on the UI
package. So the page-size fallback is now **injected** — the function takes
`{ defaultPageSize, searchParams }` and the single caller (`filter-options.loader`)
passes `DEFAULT_FILTER_PAGE_SIZE`, which it already has access to. It keeps
importing `parsePositiveInteger` from `@repo/utils` (PR2a).

Wiring: exported from the `@repo/data-access/api` barrel (the loader already
imports `fetchDistinctValues`/`getApiBaseUrl` from it); `@repo/utils` added as a
`data-access` dependency; app-specific JSDoc genericized; the api `ARCHITECTURE.md`
gains a row. Test updated for the new signature, with a case proving the injected
default is used.

## Status / next

- Current step: move + inject-default refactor + barrel + loader + dep + docs done; running the gate.
- Blockers: none.
- Next: gate green → push → PR → merge. Completes the #132 consolidation.
