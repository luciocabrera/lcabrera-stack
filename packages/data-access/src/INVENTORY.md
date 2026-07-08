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

Generic, schema/table-agnostic SQL SELECT/count builder for the "flat list
view, optional filter/sort/pagination" shape. Public entry points:
`buildSelectQuery` (`queryBuilder/buildSelectQuery.util.ts`) and
`buildCountQuery` (`queryBuilder/buildCountQuery.util.ts`), plus the shared
`QueryBuilder.types.ts` types. Every other file in that folder
(`assertSafeIdentifier`, `assertColumnAllowed`, `appendFilterClause`,
`buildWhereClause`, `buildOrderByClause`, `buildOptionalNumericClauses`,
`quoteIdentifier`) is a private, individually-tested implementation detail
composed by those two entry points — import them directly only from within
`queryBuilder/`.

---

## `src/api/` — see its own `ARCHITECTURE.md`

Client-side fetch helpers (not exported package-wide via `package.json`,
consumed via tsconfig/Vite alias instead): `getApiBaseUrl` (`api.util.ts`),
`buildPaginatedQueryParams`, `fetchAndValidate`, `fakeDelay`.

---

## Keeping This Inventory Current

When you add, rename, or remove an artifact:

- Add / update the row in the relevant table above
- If enhancing an existing artifact (making it more generic), update its description row — do **not** add a new row
