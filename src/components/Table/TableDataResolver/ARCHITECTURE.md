# TableDataResolver Architecture

Minimal component that resolves a data promise using React's `use()` hook,
then passes the result to its children render function.

## File Structure

```
TableDataResolver/
├── TableDataResolver.component.tsx   → use(dataPromise) → children(response)
├── TableDataResolver.test.tsx        → Unit test for Promise resolution and children rendering
├── TableDataResolver.types.ts        → Props (dataPromise, children render fn)
└── index.ts                          → Barrel export
```

## How It Works

```typescript
const response = use(dataPromise);
return <>{children(response)}</>;
```

When `dataPromise` is pending, React suspends this component (handled by
the parent `<Suspense>` in `TableSuspenseBoundary`). Once resolved, the
response is passed to the children render function which typically renders
the `<Table>` component.

## Props

| Prop          | Type                                 | Description             |
| ------------- | ------------------------------------ | ----------------------- |
| `dataPromise` | `Promise<TResponse>`                 | Data promise to resolve |
| `children`    | `(response: TResponse) => ReactNode` | Render function         |
