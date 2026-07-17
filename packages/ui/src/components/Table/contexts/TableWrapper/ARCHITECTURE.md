# TableWrapper Context Architecture

Lightweight ref-based context that provides DOM access to the table wrapper
element. Used by components that need to measure or scroll the table container.

## File Structure

```
TableWrapper/
├── TableWrapperContext.context.ts    → createContext (undefined default)
├── TableWrapperContext.types.ts      → TableWrapperContextValue (wrapperRef)
├── useTableWrapperRef.hook.ts       → use(TableWrapperContext) → wrapperRef
└── index.ts                          → Barrel: useTableWrapperRef
```

## Context Value

```typescript
TableWrapperContextValue = {
  readonly wrapperRef: RefObject<HTMLDivElement | null>;
};
```

Unlike the other contexts, TableWrapper does **not** use a store. It holds a single
React ref that points to the outer `<div>` wrapping the table. The ref is stable
across renders, so no external store or `useSyncExternalStore` is needed.

## Hook

| Hook | Returns | Description |
| -------------------- | ------------------------- | ----------- | -------------------------------- |
| `useTableWrapperRef` | `RefObject<HTMLDivElement | null>` | Ref to the table wrapper element |
