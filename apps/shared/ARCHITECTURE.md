# Shared Utilities Architecture

Shared utilities across API server implementations (Express and Fastify variants).

## Purpose

Eliminate code duplication between `apps/api-server` and `apps/api-server-fast` by extracting common utilities to a single source.

## Current Shared Modules

| Artifact                               | File                                                                     | Description                                                          |
| -------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| `server.constants`                     | `src/constants/server.constants.ts`                                      | Shared pagination and sanity-check constants used by both APIs       |
| `HttpError`                            | `src/errors/httpError.ts`                                                | Shared HTTP-aware error type for request validation and handlers     |
| `api.types`                            | `src/types/api.types.ts`                                                 | Shared API response/query/pagination types and query client contract |
| `buildOrderByClause`                   | `src/utils/buildOrderByClause.util.ts`                                   | Shared safe SQL ORDER BY construction utility                        |
| `formatPgAdminQuery`                   | `src/utils/formatPgAdminQuery.util.ts`                                   | Shared SQL logging formatter utility                                 |
| `serializeDatabaseValue`               | `src/utils/serializeDatabaseValue.util.ts`                               | Convert PostgreSQL row values (Buffers, objects) to JSON-safe format |
| `carSales.constants/types/repository`  | `src/features/carSales/*`                                                | Shared car-sales sorting contracts and repository implementation     |
| `dbSanity.repository`                  | `src/features/dbSanity/dbSanity.repository.ts`                           | Shared database sanity checks implementation                         |
| `enterpriseOrders.constants/types`     | `src/features/enterpriseOrders/enterpriseOrders.{constants,types}.ts`    | Shared enterprise order filter/sort contracts                        |
| `buildEnterpriseOrdersWhereClause`     | `src/features/enterpriseOrders/buildEnterpriseOrdersWhereClause.util.ts` | Shared enterprise-order filter SQL builder                           |
| `enterpriseOrders.repository`          | `src/features/enterpriseOrders/enterpriseOrders.repository.ts`           | Shared enterprise-order repository implementation                    |
| `wideAlltypes150.constants/repository` | `src/features/wideAlltypes150/*`                                         | Shared wide table sorting contracts and repository implementation    |

## Usage Across Apps

- **api-server**: imports shared constants, types, repositories, and SQL utilities from `api-shared`
- **api-server-fast**: imports shared constants, types, repositories, and SQL utilities from `api-shared`
- **Both apps**: local feature files now act as thin compatibility wrappers around shared modules

## Package Configuration

- Package name: `api-shared`
- Exports via `src/index.ts` barrel file
- Imported as `api-shared/utils/*` in sibling packages

## Future Consolidation Opportunities

- `parseJsonQueryParam.util.ts` (Express) vs `parseJsonQueryFields.util.ts` (Fastify) — different APIs but similar intent
- Route/controller/plugin orchestration (still framework-specific and intentionally app-local)

## Maintenance Notes

- Keep utilities pure and framework-agnostic
- Add JSDoc to all exported utilities
- Test shared utilities independently in `shared`
- Update both api-server and api-server-fast imports when adding new shared utilities
- `buildEnterpriseOrdersWhereClause` uses typed per-filter helpers with a single dispatch path; preserve SQL/parameter output parity when refactoring internals
