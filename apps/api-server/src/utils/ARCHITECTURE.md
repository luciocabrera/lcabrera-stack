# utils/ Architecture

Pure utility functions shared by API server features.

## Purpose

- Keep schema/controller/repository layers focused by extracting reusable parsing and formatting logic.
- Preserve side-effect-free behavior for deterministic testing.

## Current Utilities

- `buildOrderByClause.util.ts` - Build safe SQL ORDER BY clauses from allowlisted rules.
- `delay.util.ts` - Async delay helper used for simulated latency.
- `formatPgAdminQuery.util.ts` - Normalize SQL output for pgAdmin display.
- `parseJsonQueryParam.util.ts` - Parse unknown query input into JSON values when possible.
- `readQueryInteger.util.ts` - Parse numeric query values with fallback/default behavior.
- `readQueryValue.util.ts` - Read plain query value safely.
- `parseSortingRules.util.ts` - Shared sort-rule parser/validator for feature schemas.

## Guardrails

- Utilities must be pure and framework-agnostic.
- Dynamic SQL identifiers are only built from allowlisted keys.
- Runtime validation errors should be surfaced as `HttpError` from caller-facing parsing utilities.
