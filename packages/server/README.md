# `@lcabrera/server`

**Node-only** server primitives: a generic, injection-safe SQL builder for
single-table reads and writes on Postgres, a column-filter contract that maps
straight into it, and the credential primitives — secret hashing, API tokens,
short-lived access tickets — that every service ends up rewriting.

No DOM, no React, no HTTP framework. It assumes Postgres and Node and nothing
else, and the TypeScript config enforces the boundary rather than trusting it: no
DOM lib is loaded, so a stray `window` or `document` reach-in fails typecheck in
CI.

## Install

```bash
npm install @lcabrera/server
```

`pg` and `zod` come along as regular dependencies. Requires Node 20+.

## Exports

Every helper is a separate subpath — no barrel — so you import the module you
need and tests mock that module rather than a barrel.

### SQL query builder — `@lcabrera/server/db/query-builder/*`

Pure and database-free: each builder takes a descriptor and returns
`{ text, values }`. Nothing here opens a connection, so the SQL is testable
without a database.

| Import                       | Builds                                                          |
| ---------------------------- | --------------------------------------------------------------- |
| `build-select-query.util`    | `SELECT` with filters, sorting, limit/offset                    |
| `build-count-query.util`     | `COUNT(*)` (or of one column) over the same filters             |
| `build-distinct-query.util`  | Paginated `SELECT DISTINCT` on one column — filter-option lists |
| `build-insert-query.util`    | `INSERT … RETURNING`                                            |
| `build-update-query.util`    | `UPDATE … RETURNING` — **refuses to build without a filter**    |
| `build-delete-query.util`    | `DELETE … RETURNING` — **refuses to build without a filter**    |
| `build-max-value-query.util` | `COALESCE(MAX(col), 0)`, for assigning the next id              |
| `build-order-by-clause.util` | The `ORDER BY` fragment on its own                              |
| `query-builder.types`        | Descriptors, `QueryFilter`, `ComparisonOperator`, `BuiltQuery`  |

### Executing — `@lcabrera/server/db/*`

The one place the pure builders meet a connection pool.

| Import               | What it does                                                                          |
| -------------------- | ------------------------------------------------------------------------------------- |
| `get-pool.util`      | `getPool` / `closePool` — a lazily-initialised `pg.Pool` singleton                    |
| `env.schema`         | `readEnvConfig` — Zod-validated `DB_HOST`/`DB_NAME`/`DB_PASSWORD`/`DB_PORT`/`DB_USER` |
| `select-rows.util`   | Builds a select descriptor and runs it                                                |
| `insert-row.util`    | Builds an insert and runs it; defaults to `RETURNING *`                               |
| `update-rows.util`   | Builds an update and runs it; defaults to `RETURNING *`                               |
| `delete-rows.util`   | Builds a delete and runs it; defaults to `RETURNING *`                                |
| `get-max-value.util` | Returns the numeric `MAX(col)`, or 0 for an empty table                               |

### Column filters — `@lcabrera/server/filters/*`

The contract a table filter UI speaks, and the mappers that translate it into
`QueryFilter[]`. Table-agnostic — any table's filter state maps through
`toQueryFilters`.

| Import                         | What it does                                                        |
| ------------------------------ | ------------------------------------------------------------------- |
| `filters.types`                | `ColumnFilter` and its boolean/date/number/select/text members      |
| `to-query-filters.util`        | Dispatches a `Record<column, ColumnFilter>` to the per-type mappers |
| `to-date-query-filters.util`   | Date filter → `gt`/`lt`/`eq`, or `gte`+`lte` for `between`          |
| `to-number-query-filters.util` | Number/currency filter → comparison operators                       |
| `to-text-query-filters.util`   | Text filter → `ilike`/`notIlike` patterns and `eq`/`neq`            |
| `to-select-query-filters.util` | Select/multi-select → `in`/`eq`/`neq`                               |

### Credentials — `@lcabrera/server/crypto/*`, `/tokens/*`, `/tickets/*`

| Import                                | What it does                                                                  |
| ------------------------------------- | ----------------------------------------------------------------------------- |
| `crypto/hash-secret.util`             | scrypt hash of any secret, `<saltHex>:<hashHex>`, fresh salt per call         |
| `crypto/is-secret-hash-valid.util`    | Constant-time compare; returns `false` on a malformed hash, never throws      |
| `tokens/generate-api-token.util`      | Mints `{ tokenId, secret, plaintext }` with an optional prefix                |
| `tokens/parse-api-token.util`         | Splits a plaintext back into `{ tokenId, secret }`; `undefined` if malformed  |
| `tickets/sign-access-ticket.util`     | Mints `<expiresAt>.<hmac>` over `[subject, expiresAt]`                        |
| `tickets/is-access-ticket-valid.util` | Re-derives the HMAC for the subject actually requested; boolean, never throws |

## Usage

### Read a page of rows

Callers declare _what_ they want and never restate _how_ it runs.

```ts
import { selectRows } from '@lcabrera/server/db/select-rows.util';

type Order = { readonly id: number; readonly country: string };

const orders = await selectRows<Order>({
  fields: ['id', 'country'],
  filters: [{ column: 'country', operator: 'eq', value: 'NL' }],
  limit: 50,
  offset: 0,
  schema: 'sales',
  sort: [{ column: 'id', direction: 'asc' }],
  table: 'orders',
});
```

Identifiers are syntax-checked and quoted, and every value becomes a `$n`
parameter — there is no code path that concatenates a value into SQL.

One thing worth knowing before you type the row: `TRow` is an **unchecked**
contract with the table, because `pg` does not validate it. Postgres `numeric`
columns arrive as **strings**, so type them `string` and coerce at the caller.

### Take column names from a request

When a column name comes from outside, list what is allowed. `allowedColumns` is
opt-in precisely so it is a decision you make rather than a default you inherit:
omit it when every column is developer-hardcoded, pass it the moment one is not.

```ts
const rows = await selectRows<Order>({
  allowedColumns: ['id', 'country', 'total'],
  fields: requestedFields, // ← from the query string
  schema: 'sales',
  table: 'orders',
});
```

An identifier outside the list throws before any SQL is built.

### Map a table's filter state into a query

```ts
import { toQueryFilters } from '@lcabrera/server/filters/to-query-filters.util';

const filters = toQueryFilters({
  filters: {
    country: { type: 'multiSelect', values: ['NL', 'BE'] },
    total: { operator: 'between', type: 'number', value: 100, value2: 500 },
  },
});
```

The result drops straight into any descriptor's `filters`, so the filter UI and
the query layer share one vocabulary. Note the filter shapes are written for a
control the user is still editing — `between` carries `value`/`value2`, and a
number filter's `value` may be `undefined` mid-typing — so they are laxer than a
query contract would choose on its own.

### Store a credential you can never read back

`hashSecret` and `isSecretHashValid` deliberately say _secret_, not _password_ or
_token_: those are the same problem, and one audited pair means credential
hashing has a single shape everywhere.

```ts
import { hashSecret } from '@lcabrera/server/crypto/hash-secret.util';
import { isSecretHashValid } from '@lcabrera/server/crypto/is-secret-hash-valid.util';

// `plaintext` is whatever the user just typed — never stored, never logged.
export const toStoredHash = (plaintext: string) =>
  hashSecret({ secret: plaintext });

export const matches = ({
  attempt,
  stored,
}: {
  readonly attempt: string;
  readonly stored: string;
}) => isSecretHashValid({ secret: attempt, secretHash: stored });
```

`isSecretHashValid` compares in constant time and returns `false` rather than
throwing on a malformed stored hash, so a corrupt row is an auth failure and not
a 500.

### Authorize a connection with no database in the path

A **token** identifies _who_: long-lived, revocable, its hash stored and looked
up. A **ticket** grants _one thing, briefly_: it stores nothing and is verified by
re-deriving its HMAC — the shape to reach for when a channel must authorize on
connect, such as a WebSocket upgrade, with no query in the path.

```ts
import { isAccessTicketValid } from '@lcabrera/server/tickets/is-access-ticket-valid.util';
import { signAccessTicket } from '@lcabrera/server/tickets/sign-access-ticket.util';

const signingKey = readSigningKeyFromEnv();

const ticket = signAccessTicket({
  expiresAt: Date.now() + 30_000,
  secret: signingKey,
  subject: `run:${runId}`,
});

const allowed = isAccessTicketValid({
  now: Date.now(),
  secret: signingKey,
  subject: `run:${runId}`, // the subject actually requested, not a claimed one
  ticket,
});
```

Passing the **requested** subject rather than one parsed out of the ticket is what
makes the check meaningful: a valid ticket for a different subject fails. The
caller supplies `expiresAt` and `now`, which keeps both functions pure and makes
expiry trivially testable.

## Guarantees

- **Node-only, enforced by the compiler** — no DOM lib, so browser globals fail
  typecheck.
- **No unfiltered mutations** — `buildUpdateQuery` and `buildDeleteQuery` require
  at least one filter and throw without one.
- **Identifiers validated, values parameterised** — always, with an opt-in
  allow-list for request-derived column names.
- **Pure builders, isolated execution** — `query-builder/` never touches a
  connection.
- **Published as compiled ESM** (`.mjs` + `.d.mts`) with source maps and
  `"sideEffects": false`, mirroring the source tree one file per module.
- **95% coverage gate** — the build fails below it.

## Links

- [Repository](https://github.com/luciocabrera/vite-react-compiler) —
  `packages/server`
- [Changelog](https://github.com/luciocabrera/vite-react-compiler/blob/main/packages/server/CHANGELOG.md)
- Companion packages: [`@lcabrera/utils`](https://www.npmjs.com/package/@lcabrera/utils)
  (pure helpers), [`@lcabrera/api`](https://www.npmjs.com/package/@lcabrera/api)
  (the browser half), [`@lcabrera/ui`](https://www.npmjs.com/package/@lcabrera/ui)
  (React components)

MIT © Lucio Cabrera
