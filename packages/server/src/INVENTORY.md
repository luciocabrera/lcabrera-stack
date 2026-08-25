# Artifact Inventory (`@lcabrera/server`)

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

| Artifact                        | Location                                      | Description                                                                                                                                                                                                                                                                                                                           |
| ------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `readEnvConfig`                 | `db/env.schema.ts`                            | Zod schema + parser for the required `DB_*` credentials plus the optional, defaulted tuning keys (pool max, connection/idle/statement timeouts, and the grouped-read statement timeout)                                                                                                                                               |
| `readGroupStatementTimeoutMs`   | `db/env.schema.ts`                            | Just `DB_GROUP_STATEMENT_TIMEOUT_MS`, picked off the same schema — read per grouped read, so it must not require the credential keys it does not use                                                                                                                                                                                  |
| `getPool`                       | `db/get-pool.util.ts`                         | Lazily-initialized `pg.Pool` singleton, one per Node process, built from those tuning keys                                                                                                                                                                                                                                            |
| `closePool`                     | `db/get-pool.util.ts`                         | Tears down the pool singleton (test teardown)                                                                                                                                                                                                                                                                                         |
| `withTransaction`               | `db/with-transaction.util.ts`                 | Borrows a pooled connection and runs a callback inside BEGIN/COMMIT/ROLLBACK, always releasing it — thread its `tx` through every executor in the sequence (ADR-051)                                                                                                                                                                  |
| `runInTransaction`              | `db/run-in-transaction.util.ts`               | The same BEGIN/COMMIT/ROLLBACK over a connection the **caller** owns; opens and closes nothing (the migration runner's case)                                                                                                                                                                                                          |
| `ExecutorOptions`               | `db/db.types.ts`                              | The optional `tx` seam every executor accepts, plus `TransactionClient` (pg's `ClientBase`) — kept off the pure `query-builder/` descriptors on purpose                                                                                                                                                                               |
| `selectRows`                    | `db/select-rows.util.ts`                      | Builds a `SelectQueryDescriptor` and runs it on the pool — the one place `buildSelectQuery` meets `getPool`                                                                                                                                                                                                                           |
| `selectDistinctRows`            | `db/select-distinct-rows.util.ts`             | `selectRows` + `distinct: true` — deduplicated rows over the same descriptor                                                                                                                                                                                                                                                          |
| `selectGroupedRows`             | `db/select-grouped-rows.util.ts`              | Resolves the group keys' and aggregate columns' capabilities, builds the `GROUPING SETS` query from that answer and runs it — the analytical sibling of `selectRows`, returning the decode metadata beside the rows. Checks depth before any round trip, and runs inside a transaction carrying its own `statement_timeout` (ADR-066) |
| `setStatementTimeout`           | `db/set-statement-timeout.util.ts`            | Private. `set_config('statement_timeout', $1, true)` — parameterised and transaction-scoped, with `tx` **required** rather than optional                                                                                                                                                                                              |
| `selectFilterOptions`           | `db/select-filter-options.util.ts`            | Filter-dropdown read over `selectDistinctRows`: one column's distinct, non-empty (empty dropped only for `text`), ordered values → `{ values, hasMore }`. Pair it with `resolveFilterOptionsSource` (`filters/resolve-filter-options-source.util.ts`) when the schema/table arrive on a request                                       |
| `insertRow`                     | `db/insert-row.util.ts`                       | Builds + runs an `InsertQueryDescriptor`; defaults `RETURNING *`, returns the inserted row(s)                                                                                                                                                                                                                                         |
| `updateRows`                    | `db/update-rows.util.ts`                      | Builds + runs an `UpdateQueryDescriptor`; defaults `RETURNING *`, returns the updated row(s)                                                                                                                                                                                                                                          |
| `deleteRows`                    | `db/delete-rows.util.ts`                      | Builds + runs a `DeleteQueryDescriptor`; defaults `RETURNING *`, returns the deleted row(s)                                                                                                                                                                                                                                           |
| `getMaxValue`                   | `db/get-max-value.util.ts`                    | Runs `buildMaxValueQuery` and returns the numeric `MAX(col)` (0 if empty) — generic "next id" for id assignment                                                                                                                                                                                                                       |
| `getRowsCount`                  | `db/get-rows-count.util.ts`                   | Runs `buildCountQuery` and returns the row count; requires an explicit `column` (never `count(*)`) — pass the data query's filters so a page and its total share them                                                                                                                                                                 |
| `getColumnGroupingCapabilities` | `db/get-column-grouping-capabilities.util.ts` | Per column: may it be a group key (and if not, which of five reasons), and which aggregates are legal for its real Postgres type — one catalogue round trip, ADR-058                                                                                                                                                                  |

### `src/db/query-builder/` — see its own `ARCHITECTURE.md`

Generic, schema/table-agnostic SQL builder for the common single-table
read **and** write shapes. Public entry points:

- **Reads:** `buildSelectQuery` (`build-select-query.util.ts` — pass
  `distinct: true` for `SELECT DISTINCT`, or `cursor` for keyset pagination
  instead of `offset`, ADR-052), `buildCountQuery`
  (`build-count-query.util.ts`), and `buildDistinctQuery`
  (`build-distinct-query.util.ts` — the `SELECT DISTINCT` sibling of
  `buildSelectQuery`; a thin wrapper, generic over a list of columns).
- **Writes:** `buildInsertQuery` (`build-insert-query.util.ts`), `buildUpdateQuery`
  (`build-update-query.util.ts`), `buildDeleteQuery` (`build-delete-query.util.ts` —
  update/delete require ≥1 filter, never build an unfiltered mutation), and
  `buildMaxValueQuery` (`build-max-value-query.util.ts` — `COALESCE(MAX(col), 0)`
  for id assignment).

plus the shared `query-builder.types.ts` types. Every other file in that
folder (`assertSafeIdentifier`, `assertColumnAllowed`, `assertKeysetCursor`,
`appendFilterClause`, `buildWhereClause`, `buildKeysetClause`,
`buildKeysetBranch`, `buildKeysetComparison`, `buildReturningClause`,
`buildOrderByClause`, `buildOptionalNumericClauses`, `quoteIdentifier`) is a private,
individually-tested implementation detail composed by those entry points —
import them directly only from within `query-builder/`.

### `src/db/group-query-builder/` — see its own `ARCHITECTURE.md`

The pure half of grouped reads, sibling to `query-builder/` and equally
DB-free. It has two entry points, one per half.

**Legality (ADR-058).** `resolveColumnCapability`
(`resolve-column-capability.util.ts`) composes `resolveAnalyticalRole` (Gate 1,
from `pg_type.typcategory`), `buildColumnCapabilitiesQuery` (Gate 2, one
bound-parameter catalogue query), `resolveDistinctEstimate` and
`toRoleAggregates`. Run it through `getColumnGroupingCapabilities` above rather
than by hand.

`resolveAnalyticalRole` composes `isIdentifierType`
(`is-identifier-type.util.ts`), which carries the named identifier types the
category derivation would otherwise get wrong (`uuid`, `inet`, `interval` —
ADR-058, #599). The refusal side is `refuseGroupKey` (`refuse-group-key.util.ts`),
which applies the refusal rules **in priority order** so a rejected column gets
exactly one message and it is the most useful one, answering `undefined` when the
column may be a key. It composes `isUniqueIsh` (`is-unique-ish.util.ts`) — a
column with about as many distinct values as the table has rows, which groups to
one row per row and is the likeliest user mistake, so it earns its own message.

**A temporal key's granularity** ([ADR-084](../../../docs/decisions/ADR-084-a-group-key-carries-its-granularity.md)).
`resolveColumnPeriods` (`resolve-column-periods.util.ts`) answers which
granularities a column may be grouped at, and is what a surface reads **instead
of** `canGroup` for a date: one group per calendar day is exactly the tree the
guard refuses, while a month clears it comfortably. It gates on
`isPeriodCapableType` (`is-period-capable-type.util.ts`) and then runs the same
`refuseGroupKey` ladder with `resolvePeriodDistinctEstimate`
(`resolve-period-distinct-estimate.util.ts`) substituted — so role, equality and
the unique-ish rule do not become negotiable because a granularity was asked for.
That estimate is bounded twice, by the raw distinct count and by the column's
`pg_stats` histogram range, because neither alone is enough.
`resolveGroupKeyExpression` (`resolve-group-key-expression.util.ts`) is the SQL
side: one spelling of the truncation for all four places it appears, with
`timestamptz` pinned to a stated zone rather than the session's.

**Emission (ADR-059).** `buildGroupQuery` (`build-group-query.util.ts`) turns a
`GroupQueryDescriptor` into `GROUP BY GROUPING SETS` with a variadic
`GROUPING()` mask, and is the only export of this half. It takes the capability
map the legality half resolved and refuses anything the catalogue turned down,
which is how a pure function enforces ADR-058. Everything it composes
(`expandGroupingSets`, `expandCubeSets`, `toGroupingSetMask`, `assertGroupKeys`,
`assertGroupAggregates`, `assertGroupAliases`, `assertGroupSort`,
`resolveAggregateAlias`, `buildAggregateProjection`, `buildGroupingSetsClause`,
`buildGroupOrderByClause`, `collectCapabilityColumns`) is a private,
individually-tested implementation detail — import those directly only from
within `group-query-builder/`.

Two of those are worth naming for what they own. `expandCubeSets`
(`expand-cube-sets.util.ts`) produces every subset of the keys in the order
`CUBE(k₁, …, kₙ)` emits them, which is the lattice `rollup`'s prefix expansion is
not. `assertGroupSort` (`assert-group-sort.util.ts`) holds every rule a grouped
`ORDER BY` clears before a single term is emitted, so an unorderable request is
refused at construction rather than emitting a term that orders nothing.

**Execution.** `selectGroupedRows` (`db/select-grouped-rows.util.ts`) is what
joins the two halves to a connection: it resolves the capabilities, builds, and
runs. Reach for it rather than for `buildGroupQuery` directly.

**Guard rails (ADR-066).** `resolveGroupGuardRails`
(`resolve-group-guard-rails.util.ts`) is the third entry point, called from
inside `buildGroupQuery` after the legality gates: it estimates the result over
the sets that will be emitted, refuses or warns against the two thresholds, and
settles the `LIMIT`. `assertGroupDepth` (`assert-group-depth.util.ts`) is split
out of `assertGroupKeys` so the executor can run it **before borrowing a
connection**, and `assertGroupRowBackstop` (`assert-group-row-backstop.util.ts`)
is the post-execution half — a result that reached the guard's own ceiling is
refused rather than returned truncated. Everything they compose
(`estimateGroupCardinality`, `assertGroupCardinality`, `resolveGroupRowLimit`,
`resolveWidestGroupKey`, `assertGroupColumn`) is private to the folder.
`assertGroupColumn` is the one worth knowing about: it wraps the two assertions
shared with `query-builder/` so an allow-list or identifier refusal is a typed
`GroupingRefusedError` rather than a bare `Error` the loader edge can only report
as `unexpected`.

`group-query-builder.constants.ts` holds every constant the folder owns —
including the closed `AggregateFn` → SQL map, the depth cap, the warn/refuse row
thresholds and the identifier limit — and `group-query-builder.types.ts` holds the shared types. Both are
reachable through the package's `exports`, because `@lcabrera/ui` duplicates the
depth cap and the aggregate vocabulary rather than depending on this Node-only
package ([ADR-039](../../../docs/decisions/ADR-039-duplicate-over-undeclared-edges.md)),
and the app that depends on both pins the two together in
`groupingContract.test.ts`.

### `src/db/olap/` — see its own `ARCHITECTURE.md`

The read half of the same protocol `group-query-builder/` writes, and the
translation back out of it. Pure and DB-free like its two siblings.

**Decoding a grouped read.** `toGroupRow` (`to-group-row.util.ts`) turns one row
into the group summary a grid renders, reading the `GROUPING()` mask to tell a
subtotal from a real NULL — the two are textually identical and nothing else
separates them. It composes `toGroupLabel` (`to-group-label.util.ts`), which
formats a key against the closed dimension vocabulary
([ADR-058](../../../docs/decisions/ADR-058-grouping-legality-by-analytical-role.md))
and answers `(empty)` rather than guessing at anything outside it — and
`toGroupPeriodLabel` (`to-group-period-label.util.ts`), which heads a truncated
key by its period (`2021-Q2`) rather than by the instant it starts, reading the
value back in the frame it was truncated in.

**Issuing and decoding the read as one pair.** `toGroupAggregates` and
`decodeGroupedRows` (`decode-grouped-rows.util.ts`) are the two halves of the
`count(*)`-first convention — the position one puts the count in is the position
the other skips, and nothing in the type system relates them, so they live in one
module for the reason ADR-082 keeps an encoder beside its parser. `toGroupSort`
sits with them: it derives the grouped `ORDER BY` from the table's own sort, one
term per key in nesting order, dropping a sort on any column a grouped result has
no values of.

**Drilling back down.** `toDrillRead` (`to-drill-read.util.ts`) turns a group row
into the paginated read of the rows underneath it, or a typed refusal for a
grand total, a subtotal or an incomplete path
([ADR-079](../../../docs/decisions/ADR-079-drilling-from-a-group-to-its-rows.md)).
The route's primary key and page ceiling are arguments — only the route knows
them — which is the whole of what a caller supplies. `resolveDrillRefusal`
(`resolve-drill-refusal.util.ts`) is the refusal half on its own, so a route can
ask before it pays: every reason is a property of the row and the applied keys,
none of them needs the catalogue, and `toDrillRead` asks through the same
function. A **truncated** key becomes
a half-open range rather than an equality, since the group's value is a period
start no row holds; `advanceGroupPeriod` (`advance-group-period.util.ts`)
computes the upper bound by calendar arithmetic, and `toGroupKeyTruncations`
(`to-group-key-truncations.util.ts`) is where the requested granularity meets the
catalogue fact that decides which frame that arithmetic runs in
([ADR-084](../../../docs/decisions/ADR-084-a-group-key-carries-its-granularity.md)).

`resolveGroupRead` (`resolve-group-read.util.ts`) is the whole decision above it:
a request that may name a group, as the read to run. It reads the token out of
the search params, refuses an unreadable one rather than falling through to the
unscoped read, applies the translation and positions the page, and carries the
refusal messages so every consumer says the same thing about a subtotal. A route
supplies its page ceiling, its tiebreaker column and the catalogue lookup, and
nothing else
([ADR-087](../../../docs/decisions/ADR-087-a-group-opens-its-rows-in-a-route.md)).

`toGroupHeading` (`to-group-heading.util.ts`) is the heading the route serving
those rows shows: one `Label: value` per key, read back out of the token, which
carries raw values because `encodeDrillGroup` drops the group row's formatted
label on purpose. A truncated key is formatted through `toGroupPeriodLabel` and
not `toGroupLabel`, so the heading reads `2021-06` like the row that was clicked
rather than the instant underneath it.

All of this lived in `apps/react-router` until
[ADR-082](../../../docs/decisions/ADR-082-the-olap-seam-lives-in-the-packages.md);
none of it ever referenced an order. The drill request's wire codec is the one
piece that is **not** here: it is `@lcabrera/api`'s `olap/`, because the encoder
runs in the browser.

---

## `src/errors/`

This package's typed error vocabulary: translated `pg` rejections, so no consumer
ever sees a raw driver message and none has to hand-roll SQLSTATE detection
([ADR-050](../../../docs/decisions/ADR-050-server-error-translation-and-result-contract.md)),
plus the refusals the package raises itself
([ADR-066](../../../docs/decisions/ADR-066-grouping-guard-rails-and-per-query-timeout.md)).
The executors apply `mapDbError` for you — reach for it directly only when you run
SQL through `getPool` yourself.

| Artifact                         | Location                                      | Description                                                                                                                                                        |
| -------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `mapDbError`                     | `errors/map-db-error.util.ts`                 | `23505` → `UniqueConstraintViolationError`, `23503` → `ForeignKeyViolationError`, `57014` → `QueryCanceledError`, else `PersistenceError`; idempotent              |
| `PersistenceError`               | `errors/persistence.error.ts`                 | Base translated failure: a safe message of ours, the driver rejection on `cause`, pg's routing fields on `fields`                                                  |
| `UniqueConstraintViolationError` | `errors/unique-constraint-violation.error.ts` | `23505` — `fields.constraint` names the index, which is the consumer's key for routing to a form field                                                             |
| `ForeignKeyViolationError`       | `errors/foreign-key-violation.error.ts`       | `23503` — insert/update and delete directions share the code; `fields.constraint` tells them apart                                                                 |
| `QueryCanceledError`             | `errors/query-canceled.error.ts`              | `57014` — the statement was stopped early. Named for the SQLSTATE, because `pg_cancel_backend` raises it as well as `statement_timeout`                            |
| `GroupingRefusedError`           | `errors/grouping-refused.error.ts`            | A grouped read this package refused, carrying `reason`, the offending `column` and the estimated rows. **Not** a `PersistenceError` — nothing came from the driver |
| `toSerializableDbError`          | `errors/to-serializable-db-error.util.ts`     | Any of the above → `SerializableDbError`, the plain union a loader or action may return. The mandatory step at any edge (see below)                                |
| `hasPostgresErrorCode`           | `errors/has-postgres-error-code.util.ts`      | Narrows `unknown` to a pg rejection with a given SQLSTATE (e.g. `55000`), structurally so two copies of `pg` cannot defeat it                                      |
| `PgErrorFields`                  | `errors/errors.types.ts`                      | The `code`/`column`/`constraint` a translated error carries. `detail` is excluded on purpose — it quotes the offending values                                      |
| `GroupingRefusalReason`          | `errors/errors.types.ts`                      | The closed set of reasons a grouped read is refused, from `no-keys` to `row-limit-reached`                                                                         |
| `SerializableDbError`            | `errors/errors.types.ts`                      | `db-canceled` / `db-failed` / `grouping-refused` / `unexpected` — plain data, no prototype, no `cause`                                                             |

`readPgErrorFields` (`errors/read-pg-error-fields.util.ts`) and the SQLSTATE
constants (`errors/errors.constants.ts`) are private to this folder.

**These are classes, and server-only.** React Router single fetch strips
functions, so a class arrives at the client with no prototype and — because
`Error.message` is non-enumerable — no message either. Map one through
`toSerializableDbError` at the loader/action edge rather than returning it.

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
implementation. Do **not** reintroduce domain-named wrappers around
these — fallow's `thin-wrapper` rule is an error, and the duplicate
`hashPassword`/`isPasswordValid`/`hashApiToken`/`isApiTokenValid` pairs they
replaced were themselves a duplication finding.

---

## `src/filters/`

The column-filter contract between the Table filter UI and the generic query
layer, plus the mappers that translate it to `QueryFilter[]` for the builders.
Table-agnostic — any table's filter state maps through `toQueryFilters`.

`@lcabrera/ui` declares its own copy of these shapes
(`packages/ui/src/types/filterOperators.types.ts`) rather than importing or
re-exporting `filters/filters.types`: it is browser-safe and may not depend on
this package
([ADR-038](../../../docs/decisions/ADR-038-public-package-topology-by-runtime.md)),
so the contract is duplicated rather than shared through an edge that only
resolves in-repo
([ADR-039](../../../docs/decisions/ADR-039-duplicate-over-undeclared-edges.md)).
What holds the two copies in step is the conformance test
`apps/react-router/src/routes/enterprise-orders/filterContract.test.ts`, which
feeds `@lcabrera/ui`-typed filters to `toQueryFilters` — drift there fails
`typecheck`, not just the assertions.

| Artifact                     | Location                                        | Description                                                                                                                                                                                                                                                                                                                                         |
| ---------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `filters.types`              | `filters/filters.types.ts`                      | `BooleanFilter`/`ColumnFilter`/`DateFilter`/`NumberFilter`/`SelectFilter`/`TextFilter` filter shapes                                                                                                                                                                                                                                                |
| `resolveFilterOptionsSource` | `filters/resolve-filter-options-source.util.ts` | Authorizes a filter-options request against the caller's `schema.table` → column → `ColumnType` registry, ahead of any SQL: the source's `allowedColumns` + the column's type, or a refusal separating an unknown source from an unknown column. The question `selectFilterOptions` cannot answer for itself, because it takes schema/table as data |
| `toQueryFilters`             | `filters/to-query-filters.util.ts`              | Dispatches a `Record<column, ColumnFilter>` to the per-type mappers, flattening to `QueryFilter[]`                                                                                                                                                                                                                                                  |
| `toDateQueryFilters`         | `filters/to-date-query-filters.util.ts`         | Date filter → `gt`/`lt`/`eq`, or `gte`+`lte` for `between`                                                                                                                                                                                                                                                                                          |
| `toNumberQueryFilters`       | `filters/to-number-query-filters.util.ts`       | Number/currency filter → comparison ops; `between` → `gte`+`lte`                                                                                                                                                                                                                                                                                    |
| `toTextQueryFilters`         | `filters/to-text-query-filters.util.ts`         | Text filter → `ilike`/`notIlike` patterns and `eq`/`neq`                                                                                                                                                                                                                                                                                            |
| `toSelectQueryFilters`       | `filters/to-select-query-filters.util.ts`       | Select/multi-select → `in`/`eq`/`neq` (multi-value `notEquals` → an AND of `neq`, i.e. NOT IN)                                                                                                                                                                                                                                                      |

See `filters/ARCHITECTURE.md`.

---

## `src/sort/`

The sort half of the same boundary: the request-sort shape a paginated client
sends (`{ columnKey, direction }` — structurally `@lcabrera/api`'s
`PaginatedSort`) and the mapper that turns it into the `QuerySort[]` the
builders consume. Table-agnostic; reach for it instead of rewriting the rename
in every endpoint.

| Artifact           | Location                          | Description                                                                                                                       |
| ------------------ | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `sort.types`       | `sort/sort.types.ts`              | `ColumnSort` — the `{ columnKey, direction }` request shape                                                                       |
| `resolveQuerySort` | `sort/resolve-query-sort.util.ts` | Request sorting (or a fallback when it is empty) → non-empty `QuerySort[]`; throws rather than let a paginated read run unordered |

See `sort/ARCHITECTURE.md`.

---

## `src/tickets/`

Reusable, DB-free **stateless capability** primitives. A ticket
authorizes a bearer for exactly one `subject` until it expires, and is
verified by re-deriving its HMAC rather than by a lookup — the shape to reach
for on a channel that must authorize on connect with no database in the path,
a WebSocket upgrade being the case it was built for. Both are exported per-file
in the `exports` map.

| Artifact              | Location                                 | Description                                                                                       |
| --------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `signAccessTicket`    | `tickets/sign-access-ticket.util.ts`     | Mints `<expiresAt>.<hmac>` over `[subject, expiresAt]`; caller supplies the expiry, so it is pure |
| `isAccessTicketValid` | `tickets/is-access-ticket-valid.util.ts` | Re-derives the HMAC for the subject actually requested; boolean, never throws, `timingSafeEqual`  |

Not to be confused with `tokens/` below: a **token** is a long-lived, revocable
credential whose hash is stored and looked up; a **ticket** is short-lived,
stores nothing, and is scoped to one subject. Use a token to identify _who_;
use a ticket to grant _one thing, briefly_.

---

## `src/tokens/`

Reusable, DB-free bearer-token primitives. Only the halves that carry
no product decision live here: minting and parsing. The persistence they pair
with — issue, verify, list, revoke against a table of token hashes — is the
consumer's, and stays there, which is why nothing in this directory touches a
database or names a schema. Both are exported per-file in the `exports` map.
Hashing a token's secret half is **not** here — it is
`crypto/hash-secret.util.ts` above.

| Artifact           | Location                            | Description                                                                                          |
| ------------------ | ----------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `generateApiToken` | `tokens/generate-api-token.util.ts` | Mints `{ tokenId, secret, plaintext }` — plaintext is `<prefix><tokenId>.<secret>`, prefix optional  |
| `parseApiToken`    | `tokens/parse-api-token.util.ts`    | Splits a plaintext (given the same `prefix`) back into `{ tokenId, secret }`; undefined if malformed |

These are fully generic — no product-specific value is baked in; the caller
supplies any token `prefix` it wants (`acme_`), or none at all.

---

## Keeping This Inventory Current

When you add, rename, or remove an artifact:

- Add / update the row in the relevant table above. The description is **one sentence**.
- If enhancing an existing artifact (making it more generic), update that row — do **not** add a new row
