# ADR-007: Barrel Export Boundaries

**Status:** Accepted

## Context

The codebase uses many `index.ts` barrel files. Recent Fallow analysis identified:

- Circular dependencies caused by importing through internal barrels.
- Large numbers of unused re-exports from deep implementation folders.
- Hidden coupling where import direction is harder to reason about.

At the same time, barrels provide value when they are treated as stable module boundaries for external consumers.

Three approaches were considered:

1. **Barrel-only imports** everywhere.
2. **Direct-file imports** everywhere.
3. **Hybrid boundary model**: direct-file imports internally, curated barrel imports at boundaries.

## Decision

Adopt the **hybrid boundary model**.

### Rules

1. **Inside a feature/module** (same bounded area): use direct-file imports.
2. **Across feature/module boundaries**: import from a curated barrel (public API) only.
3. **Do not create deep implementation barrels** that re-export everything (actions/selectors/utils internals).
4. **Barrels must be curated**, not wildcard export surfaces.
5. **Avoid barrel back-imports** (a file importing from a barrel that re-exports that same file tree), which can create cycles.

### Barrel intent

A barrel exists to define the public surface of a boundary, not to reduce typing for internal imports.

## Consequences

- Reduced risk of circular dependencies and initialization order problems.
- Cleaner dependency direction and simpler refactoring inside modules.
- Smaller, clearer public API surfaces.
- Slightly longer internal import paths in exchange for better maintainability.

## Operational guidance

- Keep current top-level/public barrels where they represent a true API.
- Trim or remove deep internal barrels that only aggregate internals.
- During cleanup, remove unused re-exports first, then delete now-orphaned files.
- Use Fallow and lint checks to validate no regressions.
