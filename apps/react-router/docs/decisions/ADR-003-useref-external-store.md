# ADR-003: `useRef`-based External Store

**Status:** Accepted

## Context

The Table component needs to share state (column order, sorting, filters, pinning) across deeply nested components without prop drilling. Options considered: Zustand, Jotai, Valtio, React Context + `useState`, or a custom `useSyncExternalStore`-compatible store.

## Decision

Implement a lightweight `useStore` hook backed by `useRef` + `Set<listener>`, compatible with `useSyncExternalStore`.

## Reasons

- **No extra dependency** — no Zustand/Jotai to install, version, or audit.
- **Granular subscriptions** — each component subscribes to exactly the slice it needs via a selector passed to `useSyncExternalStore`; unrelated state changes don't cause re-renders.
- **Shallow equality guard** — `set()` calls `shallowEqual` before notifying listeners, suppressing no-op updates automatically.
- **SSR safe** — `getServerSnapshot()` returns the initial state snapshot, satisfying React's hydration contract.
- **Store lives in ref** — mutations never cause the owning (provider) component to re-render.
- **Reset support** — `reset()` restores to `initialState`, useful for drawer open/close cycles.

## Consequences

- Each table instance creates its own store via `useStore` inside its context provider — stores are not global singletons.
- Consumers must always use `useSyncExternalStore` via selector hooks; calling `store.get()` directly in render is a bug (no subscription = stale reads).
- Shallow equality only checks one level — nested objects in state must be replaced (not mutated) to trigger updates.
- DevTools integration (like Zustand's middleware) is not available.
