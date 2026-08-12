# Sort Architecture

The **request-sort contract** shared by a paginated client and the generic query
layer, plus the pure mapper that turns one into the other. Nothing here touches
the database — the mapper produces `QuerySort[]` values that the
`db/query-builder` builders (and their executors) consume.

Structurally the sort half of what `filters/` does for column filters: the same
kind of boundary, resolved the same way.

## Why it lives in `@lcabrera/server`

The sort _shape_ describes a table's sorting state — a UI concept, and the same
one `@lcabrera/api`'s `PaginatedSort` puts on the wire — but it is also the input
to the SQL query layer, so it is a **contract** between the two. Only this side
can reach `QuerySort`, and the dependency may not run the other way:
`@lcabrera/api` and `@lcabrera/ui` are browser-safe and this package's graph
includes the Postgres driver ([ADR-038](../../../../docs/decisions/ADR-038-public-package-topology-by-runtime.md)).
The shape is therefore restated here rather than imported
([ADR-039](../../../../docs/decisions/ADR-039-duplicate-over-undeclared-edges.md));
structural typing means a sort built by either package is assignable with no
adapter.

## Files

| File                         | Role                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `sort.types.ts`              | `ColumnSort` — the `{ columnKey, direction }` request shape the mapper accepts                                                   |
| `resolve-query-sort.util.ts` | **Entry point.** `ColumnSort[]` + a fallback → non-empty `QuerySort[]`; renames `columnKey` → `column` and refuses an empty sort |

## Contract notes

- **The result is always non-empty, and that is the point.** A paginated read
  with no ORDER BY leaves row order unspecified, so pages repeat and skip rows
  whenever the planner changes its mind between requests. That presents as data
  corruption and reproduces only under load, so the empty case is refused here —
  loudly, at the one place that can see both the request's sort and the
  endpoint's default — rather than being allowed to produce a query.
- **The request wins whenever it asked for anything.** `fallback` applies only to
  an empty `sorting`, never as a merged tiebreaker; an endpoint that wants a
  stable tiebreaker appends one to the rules it sends (ADR-008, app tier).
- **Direction is required on the input.** `@lcabrera/api`'s `PaginatedSort` makes
  it optional because a drafting UI has not chosen one yet; an ORDER BY entry
  has nothing to emit without it, so the default is applied where the request is
  parsed.

## What this does NOT do

- No SQL construction — that is `db/query-builder`. The mapper only produces the
  intermediate `QuerySort[]`.
- No column authorization — identifier safety and `allowedColumns` are enforced
  downstream by the builders (`assertSafeIdentifier` / `assertColumnAllowed`), so
  a column named here is still rejected there if the caller did not allow it.
- No cap on how many rules a request may send — that is a per-endpoint policy,
  applied where the request is parsed.
