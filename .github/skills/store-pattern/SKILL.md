---
name: store-pattern
description: External-store + split-context architecture for complex React state. Use when building or modifying stateful UI domains that need granular subscriptions and stable performance (especially Table-like components).
user-invocable: true
paths:
  [
    '**/contexts/**',
    '**/hooks/useStore.hook.ts',
    '**/hooks/useStoreSelector.hook.ts',
  ]
allowed-tools: Read
---

# Store Pattern

This skill documents the project store architecture used in the Table domain:

- split contexts by state volatility and lifecycle
- external stores via useSyncExternalStore
- strict Action/Selector boundary
- component usage via hooks, never raw store/context

## When to Apply

- Building complex stateful components (tables, grids, editors, dashboards)
- Optimizing rerenders with granular subscriptions
- Refactoring Context+useState trees that rerender too broadly
- Adding new table state (filters, sorting, pinning, pagination, drawer state)
- Reviewing PRs for direct store/context misuse in components

## ⚠️ MANDATORY References

**This SKILL.md provides OVERVIEW only. For exact patterns and constraints, read the reference files BEFORE implementing.**

| Reference                                                            | Use When                                                                                                                                                                                     |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `references/table-contexts-action-selector.md`                       | Implementing or extending the Table store/context architecture                                                                                                                               |
| `references/architecture-templates/table-contexts/*.ARCHITECTURE.md` | The Table **system's** store split — read it, do not copy a file per new folder ([ADR-088](../../../docs/decisions/ADR-088-keep-living-architecture-docs-on-systems-not-on-every-folder.md)) |
| `../quality-gate-workflow/SKILL.md`                                  | Running post-change validation after store/context updates                                                                                                                                   |

**⚠️ DO NOT implement store/context changes without reading `references/table-contexts-action-selector.md` FIRST.**

## Quick Diagnostic — Which Reference to Open

| Situation                                          | Reference to read                                                                                                             |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Adding a new state field to an existing store      | `references/table-contexts-action-selector.md` → §Actions                                                                     |
| Building a new domain's store/context from scratch | `references/architecture-templates/table-contexts/contexts.ARCHITECTURE.md` (Table's system file — do not add one per folder) |
| Debugging a stale-render or missed-update bug      | `references/table-contexts-action-selector.md` → §Selectors                                                                   |
| Adding filter state for a new column               | `references/architecture-templates/table-contexts/filters-data.ARCHITECTURE.md`                                               |
| Adding config/meta state (density, pagination)     | `references/architecture-templates/table-contexts/table-config.ARCHITECTURE.md`                                               |
| Reviewing a PR for store misuse                    | Use the Review Checklist at the bottom of this file                                                                           |

## Core Rules

1. **Components consume selectors/actions, not store/context directly.**
2. **Context hooks are infrastructure hooks** used by selector/action hooks and provider internals.
3. **Selectors are read-only and stateless.**
4. **Actions encapsulate writes, side effects, and cross-store orchestration.**
5. **Capture one snapshot per store per action execution** (`const state = store.get()`) before reading fields.
6. **Store shape changes require matching selector/action coverage** and tests.

## Quick Pattern

```tsx
// ✅ Component: read via selectors, write via actions
const isLoading = useGetTableIsLoading();
const setColumnFilter = useSetColumnFilter<MyRow>();

const handleFilterChange = (value: string) => {
  setColumnFilter({ columnKey: 'status', filter: { operator: 'eq', value } });
};
```

```tsx
// ❌ Component directly reaching into context/store
const { columnsStore } = useTableConfigContextValue<MyRow>();
const filters = columnsStore.get()?.columnFilters;
columnsStore.set({ columnFilters: nextFilters });
```

## Architecture Anchors

Table is a **system**. These files describe that system's store split. Do not
copy them into a new folder, and do not add a Props table or a file-tree
listing ([ADR-088](../../../docs/decisions/ADR-088-keep-living-architecture-docs-on-systems-not-on-every-folder.md)):

- `packages/ui/src/components/Table/ARCHITECTURE.md`
- `references/architecture-templates/table-contexts/contexts.ARCHITECTURE.md`
- `references/architecture-templates/table-contexts/table-config.ARCHITECTURE.md`
- `references/architecture-templates/table-contexts/table-data.ARCHITECTURE.md`
- `references/architecture-templates/table-contexts/filters-data.ARCHITECTURE.md`

## Review Checklist

- [ ] Component imports selectors/actions only for state access.
- [ ] No `*.component.tsx` file imports `useTable*ContextValue` for store reads/writes.
- [ ] No `store.get()`/`store.set()` calls in view components.
- [ ] Action hooks snapshot store state once per store.
- [ ] Provider order matches lifecycle/volatility requirements.
- [ ] New state fields are exposed through selector hooks.
- [ ] Mutations are centralized in action hooks.

## Further Documentation

For full implementation details and examples, read:

- `references/table-contexts-action-selector.md`
- `references/architecture-templates/table-contexts/*.ARCHITECTURE.md` — Table's system files, not a per-folder template
- `../quality-gate-workflow/SKILL.md`
