# Artifact Inventory (`@repo/server`)

Before creating anything new, check this inventory. If something here does
the job — or could do it with a small enhancement to make it more generic —
**prefer enhancing the existing artifact** over creating a new one.

Only files listed in `package.json`'s `exports` map are the package's
public surface; everything else here is an implementation detail, tested
individually but imported only within its own folder.

---

## `src/db/`

See `db/ARCHITECTURE.md` for the pure (`query-builder/`) vs impure (execution)
split this folder is built around.

| Artifact        | Location                   | Description                                                                                                     |
| --------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `readEnvConfig` | `db/env.schema.ts`         | Zod schema + parser for `DB_HOST`/`DB_NAME`/`DB_PASSWORD`/`DB_PORT`/`DB_USER`                                   |
| `getPool`       | `db/get-pool.util.ts`      | Lazily-initialized `pg.Pool` singleton, one per Node process                                                    |
| `closePool`     | `db/get-pool.util.ts`      | Tears down the pool singleton (test teardown)                                                                   |
| `selectRows`    | `db/select-rows.util.ts`   | Builds a `SelectQueryDescriptor` and runs it on the pool — the one place `buildSelectQuery` meets `getPool`     |
| `insertRow`     | `db/insert-row.util.ts`    | Builds + runs an `InsertQueryDescriptor`; defaults `RETURNING *`, returns the inserted row(s)                   |
| `updateRows`    | `db/update-rows.util.ts`   | Builds + runs an `UpdateQueryDescriptor`; defaults `RETURNING *`, returns the updated row(s)                    |
| `deleteRows`    | `db/delete-rows.util.ts`   | Builds + runs a `DeleteQueryDescriptor`; defaults `RETURNING *`, returns the deleted row(s)                     |
| `getMaxValue`   | `db/get-max-value.util.ts` | Runs `buildMaxValueQuery` and returns the numeric `MAX(col)` (0 if empty) — generic "next id" for id assignment |

### `src/db/query-builder/` — see its own `ARCHITECTURE.md`

Generic, schema/table-agnostic SQL builder for the common single-table
read **and** write shapes. Public entry points:

- **Reads:** `buildSelectQuery` (`build-select-query.util.ts`), `buildCountQuery`
  (`build-count-query.util.ts`), and `buildDistinctQuery`
  (`build-distinct-query.util.ts` — paginated `SELECT DISTINCT` for one column,
  the query behind filter-option lists, ADR-009).
- **Writes:** `buildInsertQuery` (`build-insert-query.util.ts`), `buildUpdateQuery`
  (`build-update-query.util.ts`), `buildDeleteQuery` (`build-delete-query.util.ts` —
  update/delete require ≥1 filter, never build an unfiltered mutation), and
  `buildMaxValueQuery` (`build-max-value-query.util.ts` — `COALESCE(MAX(col), 0)`
  for id assignment).

plus the shared `query-builder.types.ts` types. Every other file in that
folder (`assertSafeIdentifier`, `assertColumnAllowed`, `appendFilterClause`,
`buildWhereClause`, `buildReturningClause`, `buildOrderByClause`,
`buildOptionalNumericClauses`, `quoteIdentifier`) is a private,
individually-tested implementation detail composed by those entry points —
import them directly only from within `query-builder/`.

---

## `src/crypto/`

Credential hashing primitives, shared by **every** secret on the platform —
user passwords and API-token secrets alike. Both are exported per-file in the
`exports` map.

| Artifact            | Location                              | Description                                                                                         |
| ------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `hashSecret`        | `crypto/hash-secret.util.ts`          | scrypt hash of any secret for storage; `<saltHex>:<hashHex>`, fresh salt per call                   |
| `isSecretHashValid` | `crypto/is-secret-hash-valid.util.ts` | Constant-time compare of a secret against a stored hash; false (never throws) if malformed          |
| `SCRYPT_*`          | `crypto/crypto.constants.ts`          | scrypt salt/key sizes — private to this folder; the two halves must agree, so they share one source |

These deliberately say "secret", not "password" or "token": passwords
(`createUser`, `setUserPassword`, `authenticateUser`) and API-token secrets
(`issueApiToken`, `verifyApiToken`) are the same problem, and a single pair of
primitives keeps credential hashing to one shape and one audited
implementation (ADR-017). Do **not** reintroduce domain-named wrappers around
these — fallow's `thin-wrapper` rule is an error, and the duplicate
`hashPassword`/`isPasswordValid`/`hashApiToken`/`isApiTokenValid` pairs they
replaced were themselves a duplication finding.

---

## `src/filters/`

The column-filter contract shared by the Table filter UI (`@repo/ui`, which
re-exports the types from `filters/filters.types`) and the generic query
layer, plus the mappers that translate it to `QueryFilter[]` for the builders.
Table-agnostic — any table's filter state maps through `toQueryFilters`.

| Artifact               | Location                                  | Description                                                                                          |
| ---------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `filters.types`        | `filters/filters.types.ts`                | `BooleanFilter`/`ColumnFilter`/`DateFilter`/`NumberFilter`/`SelectFilter`/`TextFilter` filter shapes |
| `toQueryFilters`       | `filters/to-query-filters.util.ts`        | Dispatches a `Record<column, ColumnFilter>` to the per-type mappers, flattening to `QueryFilter[]`   |
| `toDateQueryFilters`   | `filters/to-date-query-filters.util.ts`   | Date filter → `gt`/`lt`/`eq`, or `gte`+`lte` for `between`                                           |
| `toNumberQueryFilters` | `filters/to-number-query-filters.util.ts` | Number/currency filter → comparison ops; `between` → `gte`+`lte`                                     |
| `toTextQueryFilters`   | `filters/to-text-query-filters.util.ts`   | Text filter → `ilike`/`notIlike` patterns and `eq`/`neq`                                             |
| `toSelectQueryFilters` | `filters/to-select-query-filters.util.ts` | Select/multi-select → `in`/`eq`/`neq` (multi-value `notEquals` → an AND of `neq`, i.e. NOT IN)       |

See `filters/ARCHITECTURE.md`.

---

## `src/tokens/`

Reusable, DB-free bearer-token primitives (ADR-029). The CQMS-specific
persistence (issue/verify/list/revoke against `cqms.api_tokens`) lives in
`@repo/scan-ingestion`; these are the generic halves any app can reuse. Both
are exported per-file in the `exports` map. Hashing a token's secret half is
**not** here — it is `crypto/hash-secret.util.ts` above.

| Artifact           | Location                            | Description                                                                                          |
| ------------------ | ----------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `generateApiToken` | `tokens/generate-api-token.util.ts` | Mints `{ tokenId, secret, plaintext }` — plaintext is `<prefix><tokenId>.<secret>`, prefix optional  |
| `parseApiToken`    | `tokens/parse-api-token.util.ts`    | Splits a plaintext (given the same `prefix`) back into `{ tokenId, secret }`; undefined if malformed |

These are fully generic — no product-specific value is baked in; the caller
supplies any token `prefix` (e.g. CodePulse passes `cqms_` from scan-ingestion).

---

## Keeping This Inventory Current

When you add, rename, or remove an artifact:

- Add / update the row in the relevant table above
- If enhancing an existing artifact (making it more generic), update its description row — do **not** add a new row
