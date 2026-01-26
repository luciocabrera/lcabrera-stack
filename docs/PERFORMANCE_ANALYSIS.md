# Table Performance Analysis & Improvement Plan

## Current Issues Observed

From the console logs, we can see significant re-rendering:

1. **EnterpriseOrders route** renders multiple times on initial load
2. **FilterPopover** logs for EVERY column (~30 columns) on each render cycle
3. **TableProvider** logs indicate multiple state initializations

## Root Cause Analysis

### 1. Context Cascade Effect
When any part of the table state changes, ALL components consuming the context re-render.

**Current Architecture:**
```
TableProvider
├── TableContext (single context with tableStore + metaStore)
│   ├── Table
│   │   ├── TableHeader
│   │   │   ├── TableHeaderCell (x30 columns)
│   │   │   │   ├── FilterPopover (x30) ← RE-RENDERS ON EVERY STATE CHANGE
│   │   │   │   └── SortIndicator (x30)
│   │   ├── TableBody
│   │   │   └── TableRow (x50+ rows)
│   │   │       └── TableBodyCell (x30 columns per row)
```

### 2. FilterPopover Rendering Every Column
Each `FilterPopover` is a separate component instance. When the parent `TableHeaderCell` re-renders, all 30 FilterPopovers re-render.

The console.warn in FilterPopover runs on every render:
```tsx
console.warn('[FilterPopover] column:', column.key, ...);
```

### 3. Object Creation in Render
Creating new objects/arrays during render causes child components to see "new" props even if values haven't changed.

## Performance Measurement Tools

### 1. Render Tracker (Created)

Use `__renderStats` in browser console:
```js
// After navigating around
__renderStats.print();

// Reset for fresh measurement
__renderStats.reset();
```

### 2. React DevTools Profiler
- Enable "Record why each component rendered"
- Look for "Context changed" and "Props changed"

### 3. React Compiler Analysis
Check if React Compiler is memoizing correctly:
```bash
# In vite.config.ts, enable logging
babel: {
  plugins: [
    ['babel-plugin-react-compiler', { 
      runtimeModule: 'react-compiler-runtime',
      logger: { logLevel: 'info' }
    }]
  ]
}
```

## Improvement Strategies

### Strategy 1: Split Context (High Impact)

Split the single TableContext into multiple focused contexts:

```tsx
// Before: Single context
<TableContext value={{ tableStore, metaStore }}>

// After: Split contexts
<TableStateContext value={tableStore}>
  <TableMetaContext value={metaStore}>
    <TableActionsContext value={actions}>
      {children}
    </TableActionsContext>
  </TableMetaContext>
</TableStateContext>
```

**Benefits:**
- Components only subscribe to what they need
- Filter changes don't re-render sorting UI
- Meta changes (loading) don't re-render data display

### Strategy 2: Granular Selectors (Medium Impact)

Current `useSyncExternalStore` already supports selectors, but we need to ensure they're stable:

```tsx
// ❌ Bad - creates new function each render
const [columnFilters] = useTableStore((state) => state.columnFilters);

// ✅ Good - stable selector reference
const selectColumnFilters = useCallback(
  (state) => state.columnFilters,
  []
);
const [columnFilters] = useTableStore(selectColumnFilters);
```

### Strategy 3: Memoize FilterPopover (Medium Impact)

```tsx
// Wrap with memo + move console.warn inside useEffect
export const FilterPopover = memo(({ column, filter, ... }) => {
  // Only log when actually relevant
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[FilterPopover] mounted:', column.key);
    }
  }, [column.key]);
  
  // ...
});
```

### Strategy 4: Lift Column Definitions (Low-Medium Impact)

Column definitions should be stable references:

```tsx
// ❌ Bad - new array on every render
const columns = [{ key: 'name', ... }];

// ✅ Good - memoized or module-level constant
const columns = useMemo(() => [...], []);
// or
const COLUMNS = [...]; // module-level constant
```

### Strategy 5: Virtualization (High Impact for Large Data)

For tables with many rows, virtualize:
- Only render visible rows
- Use `@tanstack/react-virtual` or similar

## Implementation Priority

| Priority | Strategy | Effort | Impact |
|----------|----------|--------|--------|
| 1 | Remove debug console.logs | Low | Medium |
| 2 | Memoize FilterPopover | Low | Medium |
| 3 | Stable column definitions | Low | Medium |
| 4 | Split Context | High | High |
| 5 | Row Virtualization | Medium | High (for large datasets) |

## Quick Wins (Do First)

### 1. Remove/Guard Console Logs
```tsx
// Replace all console.warn in hot paths with:
if (import.meta.env.DEV && __DEBUG_FILTERS__) {
  console.warn('[FilterPopover]', ...);
}
```

### 2. Memoize Static Components
```tsx
// FilterPopover - only re-render when filter/column changes
export const FilterPopover = memo(({ column, filter, onApply }) => {
  // ...
}, (prev, next) => {
  return prev.column.key === next.column.key && 
         prev.filter === next.filter;
});
```

### 3. Use `use` Hook Efficiently
React 19's `use` hook with context should batch better, verify we're using it correctly.

## Measurement Baseline

Before making changes, establish a baseline:

1. Navigate to `/enterprise-orders`
2. Run `__renderStats.reset()` in console
3. Wait for initial load to complete
4. Run `__renderStats.print()`
5. Document the numbers

**Target Metrics:**
- FilterPopover: Should render 1x per column on mount, not 30x
- TableHeaderCell: Should render 1x per column
- EnterpriseOrders: Should render 1-2x on initial load

## Next Steps

1. [ ] Add `useRenderTracker` to key components
2. [ ] Establish baseline metrics
3. [ ] Remove debug console.warn statements
4. [ ] Memoize FilterPopover with proper comparison
5. [ ] Audit column definitions for stability
6. [ ] Consider context splitting for v2
