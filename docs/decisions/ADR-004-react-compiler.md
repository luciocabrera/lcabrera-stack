# ADR-004: React Compiler over Manual Memoization

**Status:** Accepted

## Context

React applications commonly require `useMemo`, `useCallback`, and `React.memo` to prevent unnecessary re-renders. This adds significant boilerplate, is error-prone (wrong deps arrays), and reduces readability.

## Decision

Use **React Compiler** (React 19) and write plain, correct code without manual memoization.

## Reasons

- **Automatic memoization** — React Compiler analyzes component and hook code at build time and inserts memoization precisely where it matters, without human error.
- **Correct deps arrays** — compiler-generated memoization is always correct; hand-written `useCallback([deps])` arrays are a frequent source of stale closure bugs.
- **Cleaner code** — components express intent, not performance micro-optimizations.
- **Future-proof** — as React Compiler matures, manual optimizations can only make things worse (double-memoization).

## Consequences

- **No `useCallback` or `useMemo` for performance** — only use them when the semantic identity of a value matters (e.g. `useCallback` for a stable `onFetchInitial` reference passed to `useEffect`).
- **`React.memo` is unnecessary** for most components — the compiler handles it.
- Developers must trust the compiler; profiling should precede any manual override.
- The compiler must be enabled in `vite.config.ts` (`babel: { plugins: ['babel-plugin-react-compiler'] }`).
