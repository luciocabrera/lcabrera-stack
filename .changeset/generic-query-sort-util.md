---
'@lcabrera/ui': minor
---

`@lcabrera/ui` gains `toQuerySort` (`@lcabrera/ui/routing/shared/toQuerySort.util`) —
the sorting counterpart to `@lcabrera/server`'s `toQueryFilters`. It renames a
table `SortingState` to the `{ column, direction }` shape a paginated endpoint's
ORDER BY takes, and its result is structurally assignable to that package's
`QuerySort` with no adapter, so a client-safe package stays out of a Node-only
one's dependency graph (ADR-039).

It composes the existing `sanitizeSorting`, so the entries a sort cannot use —
the UI-only `actions` column, and any column with no direction — are dropped
rather than defaulted. That keeps the result the same length and order as the
keyset cursor tuple `toKeysetCursorValues` builds from the same sorting; a
mismatch between the two costs the cursor and the page falls back to counting
rows.

Additive only — no existing export changes.
