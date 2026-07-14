# Artifact Inventory (`@repo/data-access`)

Before creating anything new, check this inventory. If something here does
the job — or could do it with a small enhancement to make it more generic —
**prefer enhancing the existing artifact** over creating a new one.

Only files listed in `package.json`'s `exports` map are the package's
public surface; everything else here is an implementation detail, tested
individually but imported only within its own folder.

---

## `src/db/`

| Artifact        | Location             | Description                                                                   |
| --------------- | -------------------- | ----------------------------------------------------------------------------- |
| `readEnvConfig` | `db/env.schema.ts`   | Zod schema + parser for `DB_HOST`/`DB_NAME`/`DB_PASSWORD`/`DB_PORT`/`DB_USER` |
| `getPool`       | `db/getPool.util.ts` | Lazily-initialized `pg.Pool` singleton, one per Node process                  |
| `closePool`     | `db/getPool.util.ts` | Tears down the pool singleton (test teardown)                                 |

### `src/db/queryBuilder/` — see its own `ARCHITECTURE.md`

Generic, schema/table-agnostic SQL SELECT/count/distinct builder for the
"flat list view, optional filter/sort/pagination" shape. Public entry
points: `buildSelectQuery` (`queryBuilder/buildSelectQuery.util.ts`),
`buildCountQuery` (`queryBuilder/buildCountQuery.util.ts`), and
`buildDistinctQuery` (`queryBuilder/buildDistinctQuery.util.ts` — paginated
`SELECT DISTINCT` for one column, the query behind filter-option lists, ADR-009),
plus the shared `QueryBuilder.types.ts` types. Every other file in that
folder (`assertSafeIdentifier`, `assertColumnAllowed`, `appendFilterClause`,
`buildWhereClause`, `buildOrderByClause`, `buildOptionalNumericClauses`,
`quoteIdentifier`) is a private, individually-tested implementation detail
composed by those entry points — import them directly only from within
`queryBuilder/`.

---

## `src/tokens/`

Reusable, DB-free bearer-token primitives (ADR-029). The CQMS-specific
persistence (issue/verify/list/revoke against `cqms.api_tokens`) lives in
`@repo/scan-ingestion`; these are the generic halves any app can reuse. All
four are exported per-file in the `exports` map.

| Artifact           | Location                          | Description                                                                                          |
| ------------------ | --------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `generateApiToken` | `tokens/generateApiToken.util.ts` | Mints `{ tokenId, secret, plaintext }` — plaintext is `<prefix><tokenId>.<secret>`, prefix optional  |
| `parseApiToken`    | `tokens/parseApiToken.util.ts`    | Splits a plaintext (given the same `prefix`) back into `{ tokenId, secret }`; undefined if malformed |
| `hashApiToken`     | `tokens/hashApiToken.util.ts`     | scrypt hash (`<saltHex>:<hashHex>`) of the secret half, for storage                                  |
| `isApiTokenValid`  | `tokens/isApiTokenValid.util.ts`  | Constant-time compare of a secret against a stored hash; false (never throws) if malformed           |

These are fully generic — no product-specific value is baked in; the caller
supplies any token `prefix` (e.g. CodePulse passes `cqms_` from scan-ingestion).

---

## `src/api/` — see its own `ARCHITECTURE.md`

Client-side fetch helpers, exported via the `./api` entry in the
`package.json` exports map (and also reachable through the apps' Vite
alias): `getApiBaseUrl` (`api.util.ts`), `buildPaginatedQueryParams`,
`fetchAndValidate`, `fetchDistinctValues` (pages a generic distinct-values
endpoint — the HTTP half of the ADR-009 filter-options descriptors, with
`isDistinctValuesResponse` guard and the canonical `DistinctValuesResponse`
type in `src/api.types.ts`), `fakeDelay`.

---

## Keeping This Inventory Current

When you add, rename, or remove an artifact:

- Add / update the row in the relevant table above
- If enhancing an existing artifact (making it more generic), update its description row — do **not** add a new row
