---
governs:
  - server
  - api
---

# ADR-128 — Table-page handlers take a request and return a response

**Status:** Accepted

## Context

A database-backed table page needs the same pieces for every table it serves:
clamp the page window and the ORDER BY length, read rows plus an optional total,
seek past a keyset cursor or fall back to the offset, switch to a grouped read
when the grouping names a key, scope a read to one drill-down group, answer a
delete, and check the envelope on the client. `@lcabrera/server` already had
the executors and the group-read resolution under them. The binding of those
executors to one table, and the request handling around it, did not exist in
any package, so every consumer that served a table wrote them again.

Two constraints narrowed the design. `@lcabrera/server` is Node-only and
depends on no UI package or framework
([ADR-038](./ADR-038-public-package-topology-by-runtime.md)), and the shapes it
shares with the UI are duplicated rather than imported
([ADR-039](./ADR-039-duplicate-over-undeclared-edges.md)). And a consumer must
be able to declare a table once and wire each endpoint in a few lines.

## Decision

`@lcabrera/server` publishes `table-page/*`:

- `createTablePageReader` takes the table once — `target`, `primaryKey`,
  `fallbackSort`, `defaultLimit`, `maxLimit`, `groupMaxRows`, and optionally
  `fields`, `maxSortRules` and `ignoredSortColumns` — and returns functions
  bound to it. `selectPage` is the only function that sizes a read, so every
  entry point reaches the same clamps.
- `createTablePageLoader` and `createRowDeleteAction` return handlers typed
  `({ request: Request }) => Promise<Response>`. They use the Fetch API's
  `Request` and `Response` and import no router. A router whose loader receives
  `{ request }` and accepts a returned `Response` can export them directly.
- `createGroupDetailReads` returns `fetchPage` and `resolveLockedFilters`,
  typed structurally so a table loader that passes `{ effectiveSorting,
filters, request }` accepts them without an adapter.
- Each factory types the functions it receives by what it calls. The page
  loader needs only `resolvePageRead` and a `selectPage` that accepts a
  group read, so a caller can pass narrower-typed or individually imported
  functions in place of the reader.

`@lcabrera/api` publishes `isTablePageResponse`, the client-side guard for the
same envelope. It checks the envelope only and narrows to the type argument the
caller passes.

A request that names no usable sort gets `fallbackSort`. The wire contract of
the delete action — an `intent` of `delete` and an `id` form field — is
duplicated from the UI's row-actions menu, under ADR-039.

## Consequences

A consumer declares a table in one call and each endpoint is one factory call
over it. Validation, clamps and refusals live in one place, which is also where
they are tested.

The handlers answer with a plain `Response`, so a router feature that needs
its own return helper — revalidation headers, typed `data()` — is not available
through them. A route that needs one wraps the handler. A client-error
answer is a returned 400 `Response` carrying `{ error }`, never a thrown router
error, so a route error boundary does not see it.

`isTablePageResponse` checks the envelope and not each row. A row-shape check
remains the caller's.

`ignoredSortColumns` exists because a UI may send sort keys for columns that
hold no data. The package cannot know their names, so the caller has to pass
them. A caller that forgets gets the existing refusal from the query builder
for a column it does not allow.

## Alternatives considered

1. **Depend on the router and use its `data()` helper.** Rejected: it adds a
   framework edge to a Node-only package that has none, and the same handlers
   would then be unusable from any other server.
2. **Keep the binding in each consumer.** Rejected: every consumer would write
   the same clamps, cursor rule, refusal page and delete parsing again, and the
   bounds would drift between them.
3. **Validate every request filter field by field before translating it.**
   Not done here: the parser keeps the translation `toQueryFilters` already
   applies, so this change does not alter which requests are accepted.

## References

- Issue [#1221](https://github.com/luciocabrera/lcabrera-stack/issues/1221)
- [ADR-038](./ADR-038-public-package-topology-by-runtime.md),
  [ADR-039](./ADR-039-duplicate-over-undeclared-edges.md),
  [ADR-050](./ADR-050-server-error-translation-and-result-contract.md)
