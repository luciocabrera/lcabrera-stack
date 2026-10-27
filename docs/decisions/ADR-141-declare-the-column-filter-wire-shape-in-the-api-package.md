---
governs:
  - api
  - server
---

# ADR-141 — Declare the column-filter wire shape in `@lcabrera/api`, and refuse a payload that does not match it

**Status:** Accepted

**Issue:** #999. **Relates to:** [ADR-038](ADR-038-public-package-topology-by-runtime.md), [ADR-039](ADR-039-duplicate-over-undeclared-edges.md).

## Context

A paginated read carries its column filters as one JSON value in a `filter`
search param. Two packages handle that value, one at each end:

- `@lcabrera/api` builds the request. `PaginatedQuery.filter` was typed
  `unknown`, so a client could send any value and the compiler checked nothing.
- `@lcabrera/server` reads it back in `parseTablePageParams`. That code checked
  only that the decoded value was an object, then cast it to
  `Record<string, ColumnFilter>`. A payload that was not JSON, or was not an
  object, became "no filters", so the endpoint returned unfiltered rows. A
  malformed entry inside a valid object went into the query mappers unchecked.

No package declared the serialised form, so any consumer that wrote its own
client or its own endpoint had nothing to check against.

The filter shapes themselves were declared in `@lcabrera/server`
(`filters/filters.types.ts`). `@lcabrera/api` cannot import them from there:
it is browser-safe, and `@lcabrera/server` is Node-only
([ADR-038](ADR-038-public-package-topology-by-runtime.md)). The dependency
already runs the other way, because `@lcabrera/server` depends on
`@lcabrera/api` for the drill-group token, which crosses the same boundary in
the same way.

## Decision

- `@lcabrera/api/filters/filters.types` declares the column-filter shapes
  (`ColumnFilter` and its members), `ColumnFilters` (the record the `filter`
  param carries) and the parse result `ColumnFiltersParse`.
  `PaginatedQuery.filter` is `ColumnFilters`.
- `@lcabrera/api/filters/parse-column-filters.util` exports
  `parseColumnFilters(params)`. It reads an absent param as no filters, and checks
  every entry against the variant its `type` names. It returns
  `{ kind: 'parsed', filters }`, or `{ kind: 'refused', reason: 'unreadable' }`
  (not JSON, or not a plain object), or
  `{ kind: 'refused', reason: 'invalid-filter', column }`. It never throws, and
  it never returns a value it has not checked.
- Each variant's operator check is a `Record` keyed by that variant's operator
  union, so adding an operator to the type without teaching the parse about it
  fails `typecheck` in `@lcabrera/api`.
- `@lcabrera/server/filters/filters.types` re-exports those types under the
  same names and subpath. Code that imports them from the server package keeps
  working, and the query mappers now accept exactly the shape the parse
  returns.
- `parseTablePageParams` uses the parse and returns a
  `TablePageParamsResolution`. A refused filter becomes a
  `{ kind: 'refused', message, reason }` refusal instead of an unfiltered read.
  `createTablePageReader().resolvePageRead` passes that refusal through, and
  `createTablePageLoader` already answers any refusal with an empty, flagged
  page.

## Consequences

- One declaration serves both ends of the wire. `useTableRoutePage` in
  `@lcabrera/ui` passes its own filter state as `PaginatedQuery.filter`, so
  `@lcabrera/ui`'s `typecheck` now also fails when its separately declared
  shapes stop being assignable to these.
- **This breaks callers.** `parseTablePageParams` returns a discriminated
  result instead of the params, and `PaginatedQuery.filter` rejects values that
  are not `ColumnFilters`. Both packages are pre-1.0, so the changeset declares
  a `minor` and names what a caller must change.
- A request whose filter used to be ignored is now refused. A client that sent
  a filter of an unknown shape used to get every row. Now it gets no rows and a
  refusal message. That is the point of the change, and it will surprise any
  caller that relied on the old fall-through.
- `@lcabrera/ui` still declares its own copy of the shapes. This ADR does not
  merge them. The conformance test in a consumer of both packages stays, and now
  also round-trips the UI's filters through `buildPaginatedQueryParams` and
  `parseColumnFilters`.

## Alternatives considered

- **Declare a third copy of the shapes in `@lcabrera/api` and leave the
  server's in place.** Rejected. It adds a copy that has to be kept in step,
  and `@lcabrera/server` can already import from `@lcabrera/api` through a
  declared dependency. That is exactly the case
  [ADR-039](ADR-039-duplicate-over-undeclared-edges.md) does not forbid.
- **Keep the parse in `@lcabrera/server` and type only the client side.**
  Rejected. A client and a server would then validate against types that live
  in different packages, and a consumer writing its own endpoint on another
  runtime could not use the parse without installing the Postgres driver.
- **Validate with a schema library.** Rejected for now. `@lcabrera/api` depends
  only on `@lcabrera/utils`, and the shapes are small enough that hand-written
  guards stay exhaustive through the operator records.
- **Drop an invalid entry and keep the rest.** Rejected. Dropping a filter
  widens the result, so a single malformed entry would quietly return rows the
  caller asked to exclude.

## References

- Issue #999, and the premise check recorded on it.
- [ADR-038](ADR-038-public-package-topology-by-runtime.md) — runtime split
  between `@lcabrera/api` and `@lcabrera/server`.
- [ADR-039](ADR-039-duplicate-over-undeclared-edges.md) — why
  `@lcabrera/ui` keeps its own copy.
