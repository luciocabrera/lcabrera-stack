# VirtualSelect Contexts Architecture

Select-owned context for `VirtualSelect`, mirroring `Table/contexts/` (ADR-003, `store-pattern` skill). One context with a `meta` slice; the list state itself lives in the composed VirtualList context (see `../../VirtualList/contexts/ARCHITECTURE.md`) — nothing is duplicated between them.

## Context Map

| Context                | Purpose                                           | Store/Value                        |
| ---------------------- | ------------------------------------------------- | ---------------------------------- |
| `VirtualSelectContext` | Select-level presentation metadata + shell toggle | `metaStore` (+ `onToggleDropdown`) |

## One Provider, Composed (Why It Matters)

The shell mounts exactly **one** provider — `VirtualSelectProvider` — which:

1. creates `metaStore` (mirrored from the grouped `metaState` prop via a sync effect) and exposes the shell's `onToggleDropdown` on its own `VirtualSelectContext` value; then
2. **renders `VirtualListProvider` around `children`** (composition, not shell-side nesting), forwarding `dataState`/`filter`/`listState`. Its `listState.onChange` carries the shell's label↔value mapping and the single-mode close.

Delegates therefore read two contexts (`VirtualSelectContext` for metadata, `VirtualListContext` for list state) with no provider nesting visible in the shell. Composing the list provider — rather than the shell nesting three providers — is what keeps every mount site at a single provider.

## Meta Store (single owner of the select metadata)

`metaStore` holds `customStylex`, `isAlwaysOpen`, `isBusy`, `isOpen`, `listboxId`, `mode`, `placeholder` plus the pre-computed `isListVisible` (`isAlwaysOpen || isOpen` — derived in `getInitialSelectMetaState`, never in selectors). List-layout config (`listMaxHeight`, `shouldFillHeight`) is **not** here — it belongs to the list store (its single owner), where `VirtualListBody`/`VirtualListContent`/`VirtualSelectDropdown` read it. The dropdown **open state itself is shell-owned** (`useVirtualSelectDropdown` local state — UI-only state stays local per the controlled-component contract): the provider mirrors it (TableDataProvider precedent) and the `useToggleDropdown` action dispatches the shell callback from the context value (TableWrapper-ref precedent).

## Contract: Component vs Infrastructure

Same as the Table and VirtualList contexts:

- View components use only `useGet*` selectors and action hooks — never `useVirtualSelectContextValue`, never `store.get()`/`store.set()`.
- Selectors are strict one-liners through `useSelectMetaStore`; no selector calls another selector or a context-value hook.
- Each piece of state has exactly one owning store — the meta store never mirrors list state (selection labels live only in the list data store) and vice versa.

## Folder Layout

```
contexts/
├── index.ts                        → { VirtualSelectProvider }
├── VirtualSelectContext.{context,provider,types,constants}.ts(x)
├── useVirtualSelectContextValue.hook.ts
├── utils/                          → getInitialSelectMetaState (mirror + derived isListVisible)
└── meta/                          → useSelectMetaStore + selectors/ (8 one-liners)
                                     + actions/ (toggleDropdown)
```
