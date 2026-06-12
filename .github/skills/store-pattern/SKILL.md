---
name: store-pattern
description: External-store + split-context architecture for complex React state. Use when building or modifying stateful UI domains that need granular subscriptions and stable performance (especially Table-like components).
license: MIT
metadata:
  version: '1.0.0'
  scope: [root]
  auto_invoke: 'Building or modifying Table/store/context code'
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

| Reference                                                            | Use When                                                         |
| -------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `references/table-contexts-action-selector.md`                       | Implementing or extending the Table store/context architecture   |
| `references/architecture-templates/table-contexts/*.ARCHITECTURE.md` | Reusing the proven Table context architecture in other codebases |
| `../quality-gate-workflow/SKILL.md`                                  | Running post-change validation after store/context updates       |

**⚠️ DO NOT implement store/context changes without reading `references/table-contexts-action-selector.md` FIRST.**

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

Reusable local templates:

- `references/architecture-templates/table-contexts/contexts.ARCHITECTURE.md`
- `references/architecture-templates/table-contexts/table-config.ARCHITECTURE.md`
- `references/architecture-templates/table-contexts/table-data.ARCHITECTURE.md`
- `references/architecture-templates/table-contexts/filters-data.ARCHITECTURE.md`

Documentation structure benchmark:

- `apps/react-router/src/components/Button/ARCHITECTURE.md`

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
- `references/architecture-templates/table-contexts/*.ARCHITECTURE.md`
- `../quality-gate-workflow/SKILL.md`
