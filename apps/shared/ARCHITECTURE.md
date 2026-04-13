# Shared Utilities Architecture

Shared utilities across API server implementations (Express and Fastify variants).

## Purpose

Eliminate code duplication between `apps/api-server` and `apps/api-server-fast` by extracting common utilities to a single source.

## Current Shared Utilities

| Function                 | File                                       | Description                                                          |
| ------------------------ | ------------------------------------------ | -------------------------------------------------------------------- |
| `serializeDatabaseValue` | `src/utils/serializeDatabaseValue.util.ts` | Convert PostgreSQL row values (Buffers, objects) to JSON-safe format |

## Usage Across Apps

- **api-server**: `wideAlltypes150.repository.ts` — serializes row data before JSON response
- **api-server-fast**: `wideAlltypes150.repository.ts` — serializes row data before JSON response

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
