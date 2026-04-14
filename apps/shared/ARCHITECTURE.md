# Shared Utilities Architecture

Shared utilities across API server implementations (Express and Fastify variants).

## Purpose

Eliminate code duplication between `apps/api-server` and `apps/api-server-fast` by extracting common utilities to a single source.

## Current Shared Modules

| Artifact                 | File                                       | Description                                                          |
| ------------------------ | ------------------------------------------ | -------------------------------------------------------------------- |
| `server.constants`       | `src/constants/server.constants.ts`        | Shared pagination and sanity-check constants used by both APIs       |
| `HttpError`              | `src/errors/httpError.ts`                  | Shared HTTP-aware error type for request validation and handlers     |
| `api.types`              | `src/types/api.types.ts`                   | Shared API response/query/pagination types                           |
| `serializeDatabaseValue` | `src/utils/serializeDatabaseValue.util.ts` | Convert PostgreSQL row values (Buffers, objects) to JSON-safe format |

## Usage Across Apps

- **api-server**: imports `HttpError`, `server.constants`, and `api.types` from `api-shared`
- **api-server-fast**: imports `HttpError`, `server.constants`, and `api.types` from `api-shared`
- **Both apps**: `wideAlltypes150.repository.ts` uses `serializeDatabaseValue` from shared utils

## Package Configuration

- Package name: `api-shared`
- Exports via `src/index.ts` barrel file
- Imported as `api-shared/utils/*` in sibling packages

## Future Consolidation Opportunities

- `parseJsonQueryParam.util.ts` (Express) vs `parseJsonQueryFields.util.ts` (Fastify) — different APIs but similar intent
- PostgreSQL type mappings if repeated
- Error handling utilities

## Maintenance Notes

- Keep utilities pure and framework-agnostic
- Add JSDoc to all exported utilities
- Test shared utilities independently in `shared`
- Update both api-server and api-server-fast imports when adding new shared utilities
