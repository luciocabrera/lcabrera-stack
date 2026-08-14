# Shared Utilities Architecture

Shared utilities across API server implementations (Express and Fastify variants).

## Purpose

Eliminate code duplication between `apps/api-server` and `apps/api-server-fast` by extracting common utilities to a single source.

## Current Shared Modules

Every one of them has an extraction verdict — leaves with the API servers, or
promoted into a package — recorded in [EXTRACTION-AUDIT.md](EXTRACTION-AUDIT.md).
Read that before concluding a module was never examined.

| Artifact                               | File                                                                  | Description                                                                                       |
| -------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `server.constants`                     | `src/constants/server.constants.ts`                                   | Shared pagination and sanity-check constants used by both APIs                                    |
| `HttpError`                            | `src/errors/httpError.ts`                                             | Shared HTTP-aware error type for request validation and handlers                                  |
| `api.types`                            | `src/types/api.types.ts`                                              | Shared API response/row types, plus `SortRule` aliased from `@lcabrera/server`                    |
| `distinct.constants/repository`        | `src/features/distinct/*`                                             | The distinct-values source registry and the authorize-then-read repository behind `/api/distinct` |
| `runStartupDbSanityCheck`              | `src/utils/runStartupDbSanityCheck.util.ts`                           | Shared startup sanity logging flow used by both API server variants                               |
| `serializeDatabaseValue`               | `src/utils/serializeDatabaseValue.util.ts`                            | Convert PostgreSQL row values (Buffers, objects) to JSON-safe format                              |
| `carSales.constants/types/repository`  | `src/features/carSales/*`                                             | Shared car-sales sorting contracts and repository implementation                                  |
| `dbSanity.repository`                  | `src/features/dbSanity/dbSanity.repository.ts`                        | Shared database sanity checks implementation                                                      |
| `enterpriseOrders.constants/types`     | `src/features/enterpriseOrders/enterpriseOrders.{constants,types}.ts` | Shared enterprise order filter/sort contracts                                                     |
| `enterpriseOrders.fixtures`            | `src/features/enterpriseOrders/enterpriseOrders.fixtures.ts`          | Filter states both API servers must accept (`api-shared/filter-contract`)                         |
| `enterpriseOrders.repository`          | `src/features/enterpriseOrders/enterpriseOrders.repository.ts`        | Shared enterprise-order repository implementation                                                 |
| `wideAlltypes150.constants/repository` | `src/features/wideAlltypes150/*`                                      | Shared wide table sorting contracts and repository implementation                                 |

## Distinct-Source Authorization

`/api/distinct` takes schema, table and column off the request, and
`selectFilterOptions` can judge none of them — it allow-lists the column it is
handed and treats schema/table as data. The lookup that decides which sources may
be asked at all is `@lcabrera/server`'s `resolveFilterOptionsSource`, promoted out
of this package by [#688](https://github.com/luciocabrera/vite-react-compiler/issues/688)
because the showcase's own `/_api/filter-options` had hand-rolled the same one.

What stays here is the part that is ours: `distinct.constants.ts` is the registry
(which tables, which columns, each column's type), and `parseDistinctSource` is
the HTTP edge that turns a refusal into a 400 — separating an unknown source from
an unknown column, as this API always has.

## The Enterprise-Order Filter Contract

The column-filter shape is `@lcabrera/server`'s, aliased — not restated.
[ADR-039](../../docs/decisions/ADR-039-duplicate-over-undeclared-edges.md) has
`@lcabrera/ui` and `@lcabrera/server` declare it twice because neither may
depend on the other; that reason does not reach this package, which already
declares `@lcabrera/server` and passes the filters it parses straight to
`toQueryFilters`. So `enterpriseOrders.types.ts` aliases `ColumnFilter` rather
than keeping a copy that can drift — the rule the two cases split on is
[ADR-064](../../docs/decisions/ADR-064-converge-app-copies-of-a-declared-contract.md).

Two copies remain and cannot be aliased, because they are not types: the Zod
schema in `apps/api-server` and the JSON Schema in `apps/api-server-fast`. They
are held in step behaviourally instead.
`ENTERPRISE_ORDER_FILTER_CONTRACT_CASES` states every filter state the endpoints
must accept, and both API servers assert against it that a case is accepted
**and** reaches the query layer with the clauses the React Router route builds
from the same JSON.

It is reached through the **`api-shared/filter-contract` subpath, not the
barrel**. Both API servers import the barrel from `server.ts`, compile with
plain `tsc` and run `node dist/server.js` — no bundler, so nothing is
tree-shaken, and a barrel export would build this object at every server start
for the benefit of two test suites. Keep it off the barrel.

How much the case set guards depends on the group, and the difference is worth
knowing before relying on it. The per-variant groups are keyed by that variant's
own operator union, so adding an operator to the shared contract stops this
package compiling until a case exists, and the case then fails both suites until
the two schemas accept it. The `drafting` group has no such anchor — "a value the
mappers drop" spans an absent key, an empty string and an empty array, which
share no closed vocabulary — so a case removed from it is silently no longer
checked. Each API server therefore also carries those states as a named
regression in its own suite; see
[ADR-064](../../docs/decisions/ADR-064-converge-app-copies-of-a-declared-contract.md).

What the contract admits is wider than a SQL-facing one would be: a filter the
user is still editing carries no value yet, and the `@lcabrera/server` mappers
drop it instead of rejecting it. Neither request schema may be stricter than
that.

## Usage Across Apps

- **api-server**: imports shared constants, types, repositories, and SQL utilities from `api-shared`
- **api-server-fast**: imports shared constants, types, repositories, and SQL utilities from `api-shared`
- **Both apps**: local feature files now act as thin compatibility wrappers around shared modules

## Package Configuration

- Package name: `api-shared`
- Two export entries: `.` (the `src/index.ts` barrel — everything a server needs at runtime) and `./filter-contract` (the filter contract cases, kept off the barrel because it is test-support and the servers run unbundled)
- Build task: `tsc -p tsconfig.json` in `vite.config.ts`, with `typescript` declared in local `devDependencies`
- Both API servers' `test` tasks `dependsOn` this build, because every export resolves to `dist` at runtime

## Future Consolidation Opportunities

- `parseJsonQueryParam.util.ts` (Express) vs `parseJsonQueryFields.util.ts` (Fastify) — different APIs but similar intent
- Route/controller/plugin orchestration (still framework-specific and intentionally app-local)

## Maintenance Notes

- Keep utilities pure and framework-agnostic
- Add JSDoc to all exported utilities
- Test shared utilities independently in `shared`
- Update both api-server and api-server-fast imports when adding new shared utilities
- Wide-alltypes sorting excludes non-orderable columns (currently `c_018` with PostgreSQL `point` type) and caps accepted sort rules to prevent invalid or excessive ORDER BY clauses
