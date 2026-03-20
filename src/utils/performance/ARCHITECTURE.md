# Performance Utils Architecture

Development-only render instrumentation for measuring component render counts,
timings, and prop-change diagnostics.

## File Structure

```
performance/
├── ARCHITECTURE.md
├── index.ts
├── renderTracker.util.ts
└── useRenderTracker.hook.ts
```

## Dependency Graph

```mermaid
graph TD
  Index[index.ts] --> Hook[useRenderTracker.hook.ts]
  Hook --> Util[renderTracker.util.ts]
  Util --> Window[window.__renderStats (DEV only)]
```

## Utilities

### renderTracker.util.ts

Core tracking system storing per-component render records in an in-memory map.

Record fields:

- `count`: number of renders
- `lastRenderTime`: timestamp relative to session start
- `renderTimes`: sampled render timestamps (up to 100)
- `totalTime`: cumulative measured render duration

```mermaid
flowchart TD
  A[trackRender componentName] --> B{PROD mode}
  B -- yes --> C[Return]
  B -- no --> D[Get/Create RenderRecord in Map]
  D --> E[Increment count and update timestamps]

  F[trackRenderComplete componentName startTime] --> G{PROD mode}
  G -- yes --> H[Return]
  G -- no --> I[duration = performance.now - startTime]
  I --> J[Add duration to totalTime]
```

`renderStats` API:

- `getAll`, `getComponent`, `getSummary`
- `print` (console tables)
- `toJSON` (export payload)
- `copy` (clipboard when available)
- `reset`

```mermaid
flowchart TD
  A[renderStats.*] --> B[getAll/getComponent]
  A --> C[getSummary]
  A --> D[print -> console.group + tables]
  A --> E[toJSON -> structured export]
  A --> F[copy -> clipboard or console fallback]
  A --> G[reset -> clear Map]
```

Environment behavior:

- Disabled in production via `import.meta.env.PROD` guards.
- In development, exposes `globalThis.__renderStats` for console use.

### useRenderTracker.hook.ts

Hook wrapper integrating tracking into component lifecycle.

```mermaid
sequenceDiagram
  participant R as React Render
  participant H as useRenderTracker
  participant U as renderTracker.util
  participant C as Commit (useEffect)

  R->>H: Hook called with componentName and options
  H->>H: Resolve isEnabled (default true)
  H->>U: trackRender(componentName) in DEV
  H->>H: Optional prop diff logging
  H->>H: Store render start timestamp
  C->>U: trackRenderComplete(componentName, startTime)
```

Key behavior:

- Optional `logProps` compares previous/current props by strict equality.
- Logs changed prop keys for render diagnostics.
- Uses `useEffect` without dependency array to run after each commit.

## Barrel Exports

`index.ts` exports only `useRenderTracker` as the public API.
