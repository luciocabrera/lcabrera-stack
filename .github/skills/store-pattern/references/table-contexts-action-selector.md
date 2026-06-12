---
title: Table Contexts, Actions, and Selectors
description: Concrete store-pattern guidance based on the Table component architecture
tags: [react, useSyncExternalStore, context, selectors, actions, table]
---

# Table Contexts, Actions, and Selectors

## Overview

The Table uses **four contexts** with external stores to isolate update frequency and preserve UX across Suspense boundaries.

## Context Map

| Context        | Purpose                             | Store/Value                 |
| -------------- | ----------------------------------- | --------------------------- |
| `TableConfig`  | Column config + table meta UI state | `columnsStore`, `metaStore` |
| `FiltersData`  | Per-column filter option datasets   | `filtersDataStore`          |
| `TableData`    | Rows/loading/pagination             | `dataStore`                 |
| `TableWrapper` | Wrapper DOM access                  | `wrapperRef` (no store)     |

Reference architecture templates (local, reusable):

- `architecture-templates/table-contexts/contexts.ARCHITECTURE.md`
- `architecture-templates/table-contexts/table-config.ARCHITECTURE.md`
- `architecture-templates/table-contexts/table-data.ARCHITECTURE.md`
- `architecture-templates/table-contexts/filters-data.ARCHITECTURE.md`

## Provider Order (Why It Matters)

1. `TableConfigProvider` (stable config state)
2. `FiltersDataProvider` (must survive Suspense transitions)
3. Suspense boundary
4. `TableDataProvider` (recreated on transitions)
5. `TableWrapperContext` (DOM ref locality)

If this order changes, filter dropdown cache continuity and data lifecycle semantics can break.

## Contract: Component vs Infrastructure

| Layer                               | Allowed                                                                                     | Forbidden                              |
| ----------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------- |
| View components (`*.component.tsx`) | selector hooks (`useGet*`), action hooks (`useSet*`, `useFetch*`, `useBatch*`, `useReset*`) | direct context/store reads/writes      |
| Selector hooks                      | read from store via `useSyncExternalStore` wrappers                                         | side effects or writes                 |
| Action hooks                        | write to stores, orchestrate persistence/prefetch/url sync                                  | exposing raw store to components       |
| Providers/context hooks             | create/provide stores and guard context usage                                               | business logic leaking into components |

### Canonical Rule

**Components do not call `store.get()` or `store.set()` directly.**
They call selectors for reads and actions for writes.

## Good vs Bad

```tsx
// ✅ GOOD: component depends on selector + action hooks only
import { useGetTableIsLoading } from '@/components/Table/contexts/TableData/data/selectors';
import { useSetColumnFilter } from '@/components/Table/contexts/TableConfig/columns/actions';

const isLoading = useGetTableIsLoading();
const setColumnFilter = useSetColumnFilter<MyRow>();
```

```tsx
// ❌ BAD: component reaches into context/store internals
import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

const { columnsStore } = useTableConfigContextValue<MyRow>();
const state = columnsStore.get();
columnsStore.set({ columnFilters: next });
```

## Snapshot Safety Rule

Inside action hooks, read each store once and work from that snapshot:

```ts
// ✅ capture once
const columnsState = columnsStore.get();
const currentFilters = columnsState?.columnFilters ?? {};
```

```ts
// ❌ multiple reads from same store in one action path
const currentFilters = columnsStore.get()?.columnFilters ?? {};
const currentOrder = columnsStore.get()?.columnOrder ?? [];
```

Rationale: concurrent updates between reads can yield inconsistent derived calculations.

## Real Usage Patterns in Code

- Component selectors:
  - `apps/react-router/src/components/Table/TableHeader/TableHeader.component.tsx`
  - `apps/react-router/src/components/Table/TableBody/TableBody.component.tsx`
- Action orchestration:
  - `apps/react-router/src/components/Table/contexts/TableConfig/columns/actions/useSetColumnFilter.hook.ts`

## Action Responsibilities

Action hooks may:

- mutate one or more stores
- coordinate cross-store state (`columnsStore` + `metaStore` + `dataStore`)
- persist state slices (URL/cookie/local storage)
- trigger async workflows (fetch more, fetch filter options, prefetch)

Action hooks should not:

- return raw store handles to components
- include rendering concerns

## Selector Responsibilities

Selector hooks should:

- subscribe narrowly to state slice needed by consumer
- return stable shape for component consumption
- remain side-effect free

Selector hooks should not:

- mutate state
- perform persistence/fetch side effects

## Practical PR Checks

1. Search for context hook usage in components:
   - `useTableConfigContextValue`
   - `useTableDataContextValue`
   - `useFiltersDataContextValue`
2. If found in `*.component.tsx`, request refactor to selector/action hooks.
3. Search for `.get()`/`.set()` in component files and block unless it is provider/infrastructure code.
4. Validate new state fields expose selector(s) and action(s) before component usage.

## Documentation Pattern

Follow the architecture doc quality bar shown in:

- `apps/react-router/src/components/Button/ARCHITECTURE.md`

Recommended sections:

- File structure
- Dependencies graph
- Render/data flow diagram
- Props/state tables
- Consumer map
