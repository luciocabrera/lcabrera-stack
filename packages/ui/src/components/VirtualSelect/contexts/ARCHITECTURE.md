# VirtualSelect Contexts Architecture

Select-owned context for `VirtualSelect`, mirroring `Table/contexts/` (ADR-003, `store-pattern` skill). One context with a `meta` slice; the list state itself lives in the lifted VirtualList contexts (see `../../VirtualList/contexts/ARCHITECTURE.md`) — nothing is duplicated between them.

## Context Map

| Context               | Purpose                                           | Store/Value                        |
| --------------------- | ------------------------------------------------- | ---------------------------------- |
| `VirtualSelectConfig` | Select-level presentation metadata + shell toggle | `metaStore` (+ `onToggleDropdown`) |

## Provider Order (Why It Matters)

The shell mounts three providers:

1. `VirtualSelectConfigProvider` — creates `metaStore`, mirrored from the shell props via a sync effect; exposes the shell's `onToggleDropdown` on the context value.
2. `VirtualListConfigProvider` (lifted) — list config + callbacks; its `onChange` carries the shell's label↔value mapping and the single-mode close.
3. `VirtualListDataProvider` (lifted) — data mirror; reads config flags/callbacks from the list config context (single owner), so it **must render inside** it.

## Meta Store (single owner of the select metadata)

`metaStore` holds `customStylex`, `isAlwaysOpen`, `isBusy`, `isOpen`, `listboxId`, `listMaxHeight`, `mode`, `placeholder`, `shouldFillHeight` plus the pre-computed `isListVisible` (`isAlwaysOpen || isOpen` — derived in `getInitialSelectMetaState`, never in selectors). The dropdown **open state itself is shell-owned** (`useVirtualSelectDropdown` local state — UI-only state stays local per the controlled-component contract): the provider mirrors it (TableDataProvider precedent) and the `useToggleDropdown` action dispatches the shell callback from the context value (TableWrapper-ref precedent).

## Contract: Component vs Infrastructure

Same as the Table and VirtualList contexts:

- View components use only `useGet*` selectors and action hooks — never `useVirtualSelectConfigContextValue`, never `store.get()`/`store.set()`.
- Selectors are strict one-liners through `useSelectMetaStore`; no selector calls another selector or a context-value hook.
- Each piece of state has exactly one owning store — the meta store never mirrors list state (selection labels live only in the list data store) and vice versa.

## Folder Layout

```
contexts/
├── index.ts                        → { VirtualSelectConfigProvider }
└── VirtualSelectConfig/
    ├── VirtualSelectConfigContext.{context,provider,types,constants}.ts(x)
    ├── useVirtualSelectConfigContextValue.hook.ts
    ├── utils/                      → getInitialSelectMetaState (mirror + derived isListVisible)
    └── meta/                       → useSelectMetaStore + selectors/ (10 one-liners)
                                      + actions/ (toggleDropdown)
```
