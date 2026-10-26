---
governs:
  - server
---

# ADR-140 — Build every read through one entry point, and deprecate the shape-specific builders

**Status:** Accepted

**Date:** 2026-10-26

**Issue:** [#997](https://github.com/luciocabrera/lcabrera-stack/issues/997)

## Context

`@lcabrera/server` exported four read builders: `buildSelectQuery`,
`buildDistinctQuery`, `buildCountQuery` and `buildGroupQuery`. Each took its own
descriptor, and the grouped one spoke a second vocabulary (`keys` and
`GroupSort`, against `fields` and `QuerySort`). A caller expressing a read had
to choose a builder first, and the package documented each one as a public
entry point.

The builders compose rather than compete. A row read, its count and a grouped
read share the same identifier check, the same `allowedColumns` authorization
and the same `WHERE` construction. The difference between them is the shape of
the descriptor, not the safety of the result.

## Decision

`buildReadQuery`, in `db/query-builder/build-read-query.util.ts`, is the one
query entry point for a read. It takes a `ReadQueryDescriptor`, a union of three
shapes, and the shape decides the SQL:

- a descriptor carrying `grouping` builds a `GROUPING SETS` read and returns
  `BuiltGroupQuery`;
- a descriptor carrying `count: true` builds the count over the same `WHERE`;
- any other descriptor builds `SELECT [DISTINCT] fields`, paginated by
  `limit`/`offset` or a keyset `cursor`.

The return type is computed from the descriptor (`BuiltReadQuery`), so a
grouped caller gets its decode metadata without narrowing. Each shape forbids
the others' fields at the type level. A grouped read takes no pagination,
because it is never paginated.

The implementations are private files that only the entry point imports:
`build-rows-read.util.ts`, `build-count-read.util.ts` and
`group-query-builder/build-grouped-read.util.ts`. `selectColumnAxisValues`
builds through `buildReadQuery`. `selectRows`, `getRowsCount` and
`selectGroupedRows` receive a caller's descriptor for one fixed shape, so each
calls that shape's private builder directly.

The four old builders keep their subpaths and their exports. Each is marked
`@deprecated` and calls the private builder for the shape its parameter type
names, which is the builder the entry point uses for that shape. None of them
dispatches. A descriptor that also carries `count` or `grouping` (one an untyped
caller can still pass) gets the same SQL it got before this change, and is not
rerouted to another shape. Removing them is a separate decision.

The write builders (`buildInsertQuery`, `buildUpdateQuery`, `buildDeleteQuery`,
`buildMaxValueQuery`) are not reads and stay as they are.

## Consequences

- A consumer learns one function and one descriptor for every read. The query
  builder documentation names one entry point.
- The safety gates have one route in for reads. A new read shape is added as a
  variant of the union and is covered by the same tests of the entry point.
- The entry point holds a type assertion: its body returns the union of the
  three results, and the computed return type is asserted on top of that.
  TypeScript cannot check a conditional return type against a narrowed generic.
  The assertion is pinned by `expectTypeOf` tests, which `tsc` checks.
- The deprecated builders now take the descriptor as one parameter instead of
  destructuring it. The published surface records that as a changed signature,
  although the parameter and return types are unchanged.
- Biome's `noDeprecatedImports` rejects any import of a deprecated builder,
  including from a test. The deprecated subpaths therefore have no colocated
  test of their own. Each is one call to a private builder. That builder's own
  tests, and the executor tests for `selectRows`, `getRowsCount` and
  `selectGroupedRows`, check that a descriptor carrying another shape's field
  still gets its own shape's SQL.
- A grouped read still needs the `capabilities` map, which only a catalogue
  round trip answers. The entry point is pure, so it cannot fetch that map.
  `selectGroupedRows` remains the way to fetch it and run the read in one call.

## Alternatives considered

- **Remove the old builders now.** Rejected: every one is on npm, and removing
  them breaks a caller with no deprecation window. Whether and when to remove
  them is the package owner's decision.
- **Keep each builder public and add the entry point beside them.** Rejected:
  that leaves the menu this decision replaces, with one more item in it.
- **Fold the executors in.** Rejected: an executor pairs a builder with a
  connection, and putting connection handling behind the query entry point
  would make the pure half impure.
- **Return the union and make the caller narrow.** Rejected: every grouped
  caller needs the decode metadata, so each would need the same `in` check to
  get the type the descriptor already implies.

## References

- [ADR-052](ADR-052-keyset-pagination-for-infinite-scroll.md) — the keyset
  cursor the row shape carries
- [ADR-058](ADR-058-grouping-legality-by-analytical-role.md) and
  [ADR-059](ADR-059-aggregation-is-builder-generated.md) — the grouped shape's
  legality and emission, unchanged here
- `docs/product/requirements/express-a-read-through-one-entry-point.md`
