# Shared Utilities Architecture

Shared utilities across API server implementations (Express and Fastify variants).

## Purpose

Eliminate code duplication between `apps/api-server` and `apps/api-server-fast` by extracting common utilities to a single source.

## Current Shared Modules

| Artifact                               | File                                                                  | Description                                                          |
| -------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `server.constants`                     | `src/constants/server.constants.ts`                                   | Shared pagination and sanity-check constants used by both APIs       |
| `HttpError`                            | `src/errors/httpError.ts`                                             | Shared HTTP-aware error type for request validation and handlers     |
| `api.types`                            | `src/types/api.types.ts`                                              | Shared API response/query/pagination types and query client contract |
| `buildOrderByClause`                   | `src/utils/buildOrderByClause.util.ts`                                | Shared safe SQL ORDER BY construction utility                        |
| `formatPgAdminQuery`                   | `src/utils/formatPgAdminQuery.util.ts`                                | Shared SQL logging formatter utility                                 |
| `runStartupDbSanityCheck`              | `src/utils/runStartupDbSanityCheck.util.ts`                           | Shared startup sanity logging flow used by both API server variants  |
| `serializeDatabaseValue`               | `src/utils/serializeDatabaseValue.util.ts`                            | Convert PostgreSQL row values (Buffers, objects) to JSON-safe format |
| `carSales.constants/types/repository`  | `src/features/carSales/*`                                             | Shared car-sales sorting contracts and repository implementation     |
| `dbSanity.repository`                  | `src/features/dbSanity/dbSanity.repository.ts`                        | Shared database sanity checks implementation                         |
| `enterpriseOrders.constants/types`     | `src/features/enterpriseOrders/enterpriseOrders.{constants,types}.ts` | Shared enterprise order filter/sort contracts                        |
| `enterpriseOrders.fixtures`            | `src/features/enterpriseOrders/enterpriseOrders.fixtures.ts`          | The filter states both API servers must accept — see below           |
| `enterpriseOrders.repository`          | `src/features/enterpriseOrders/enterpriseOrders.repository.ts`        | Shared enterprise-order repository implementation                    |
| `wideAlltypes150.constants/repository` | `src/features/wideAlltypes150/*`                                      | Shared wide table sorting contracts and repository implementation    |

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
must accept, keyed by each variant's own operator union, and both API servers
assert against it that a case is accepted **and** reaches the query layer with
the clauses the React Router route builds from the same JSON. Adding an operator
to the shared contract therefore stops this package compiling until a case
exists, and the case then fails both suites until the two schemas accept it.

What that contract admits is wider than a SQL-facing one would be: a filter the
user is still editing carries no value yet, and the `@lcabrera/server` mappers
drop it instead of rejecting it. Neither request schema may be stricter than
that — the `drafting/*` cases are the regression set.

## Usage Across Apps

- **api-server**: imports shared constants, types, repositories, and SQL utilities from `api-shared`
- **api-server-fast**: imports shared constants, types, repositories, and SQL utilities from `api-shared`
- **Both apps**: local feature files now act as thin compatibility wrappers around shared modules

## Package Configuration

- Package name: `api-shared`
- Exports via `src/index.ts` barrel file
- Imported as `api-shared/utils/*` in sibling packages
- Build task: `tsc -p tsconfig.json` in `vite.config.ts`, with `typescript` declared in local `devDependencies`

## Future Consolidation Opportunities

- `parseJsonQueryParam.util.ts` (Express) vs `parseJsonQueryFields.util.ts` (Fastify) — different APIs but similar intent
- Route/controller/plugin orchestration (still framework-specific and intentionally app-local)

## Maintenance Notes

- Keep utilities pure and framework-agnostic
- Add JSDoc to all exported utilities
- Test shared utilities independently in `shared`
- Update both api-server and api-server-fast imports when adding new shared utilities
- Wide-alltypes sorting excludes non-orderable columns (currently `c_018` with PostgreSQL `point` type) and caps accepted sort rules to prevent invalid or excessive ORDER BY clauses
