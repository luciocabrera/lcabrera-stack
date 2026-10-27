# `@lcabrera/server`

**Node-only** server primitives: a generic, injection-safe SQL builder for
reads and writes on Postgres, a column-filter contract that maps
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

**`build-read-query.util` is the one entry point for a read.** `buildReadQuery`
takes a single descriptor — fields, filters, sort, `limit`/`offset` or a keyset
`cursor`, `distinct`, `count: true` for a total, or `aggregates`, `grouping` and
`keys` for a grouped read — and returns the query. A grouped descriptor returns
the keys and grouping masks its rows are decoded by as well; its `capabilities`
map comes from `get-column-grouping-capabilities.util`.

A read can reach further tables with `joins`, but only along a foreign key the
schema declares, and only in the many-to-one direction, so a join adds columns
to a row and never repeats one. Each join names the referencing columns on a
table the read already reaches, an `alias`, `inner` or `left`, and its own
`allowedColumns`. The base target's `allowedColumns` is then required too. The
target and the `ON` clause come from the `relations` map, which
`get-foreign-key-relations.util` reads from the catalogue. A joined column is
written `{ column, source: '<alias>' }`, is checked against that join's own
list, and comes back as `<alias>.<column>`. A keyset cursor's `uniqueColumn`
stays a base-target column.

A flat grouped read (`grouping: 'flat'`, no `columnAxis`) can also filter its
groups with `groupFilters`, which become `HAVING`: each entry names one of the
read's aggregate aliases, an operator and a parameterized value.

```ts
const page = buildReadQuery({
  allowedColumns: ['id', 'vendor_id', 'amount'],
  fields: ['id', 'amount', { column: 'name', source: 'vendor' }],
  joins: [
    {
      alias: 'vendor',
      allowedColumns: ['name', 'region'],
      foreignKey: ['vendor_id'],
      kind: 'left',
    },
  ],
  relations, // getForeignKeyRelations({ depth: 1, schema: 'catalog', table: 'items' })
  schema: 'catalog',
  sort: [{ column: 'id', direction: 'asc' }],
  table: 'items',
});

const busyRegions = buildReadQuery({
  aggregates: [{ fn: 'count' }, { column: 'amount', fn: 'sum' }],
  allowedColumns: ['region', 'amount'],
  capabilities,
  groupFilters: [{ aggregateAlias: 'sum_amount', operator: 'gt', value: 1000 }],
  grouping: 'flat',
  keys: ['region'],
  maxRows: 5000,
  schema: 'catalog',
  table: 'items',
});
```

```ts
import { buildReadQuery } from '@lcabrera/server/db/query-builder/build-read-query.util';

const { text, values } = buildReadQuery({
  aggregates: [{ fn: 'count' }, { column: 'amount', fn: 'sum' }],
  allowedColumns: ['region', 'status', 'amount'],
  capabilities,
  filters: [{ column: 'status', operator: 'eq', value: 'open' }],
  grouping: 'rollup',
  keys: ['region', 'status'],
  maxRows: 5000,
  schema: 'catalog',
  sort: [{ aggregateAlias: 'sum_amount', direction: 'desc' }],
  table: 'items',
});
```

| Import                       | Builds                                                                        |
| ---------------------------- | ----------------------------------------------------------------------------- |
| `build-read-query.util`      | Every read: rows, a distinct projection, a count, or a grouped aggregate read |
| `build-insert-query.util`    | `INSERT … RETURNING`                                                          |
| `build-update-query.util`    | `UPDATE … RETURNING` — **refuses to build without a filter**                  |
| `build-delete-query.util`    | `DELETE … RETURNING` — **refuses to build without a filter**                  |
| `build-max-value-query.util` | `COALESCE(MAX(col), 0)`, for assigning the next id                            |
| `build-order-by-clause.util` | The `ORDER BY` fragment on its own                                            |
| `query-builder.types`        | Descriptors, `QueryFilter`, `ComparisonOperator`, `BuiltQuery`                |

`build-select-query.util`, `build-distinct-query.util`, `build-count-query.util`
and `group-query-builder/build-group-query.util` are deprecated. Each still
exports its builder and returns the same SQL as before. Move to `buildReadQuery`.

### Executing — `@lcabrera/server/db/*`

The one place the pure builders meet a connection. Every executor takes an
optional `tx` and translates driver rejections (see the two sections below).

| Import                           | What it does                                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `get-pool.util`                  | `getPool` / `closePool` — a lazily-initialised `pg.Pool` singleton that survives an idle-connection failure |
| `env.schema`                     | `readEnvConfig` — Zod-validated `DB_*` credentials plus optional pool tuning                                |
| `db.types`                       | `ExecutorOptions` (the optional `tx`) and `TransactionClient`                                               |
| `select-rows.util`               | Builds a select descriptor and runs it; reads the relation map first when it joins and carries none         |
| `get-foreign-key-relations.util` | The foreign keys a read with `joins` may follow, in one catalogue round trip                                |
| `insert-row.util`                | Builds an insert and runs it; defaults to `RETURNING *`                                                     |
| `update-rows.util`               | Builds an update and runs it; defaults to `RETURNING *`                                                     |
| `delete-rows.util`               | Builds a delete and runs it; defaults to `RETURNING *`                                                      |
| `get-max-value.util`             | Returns the numeric `MAX(col)`, or 0 for an empty table                                                     |
| `with-transaction.util`          | Runs a callback on one pooled connection in BEGIN/COMMIT/ROLLBACK, always releasing                         |
| `run-in-transaction.util`        | The same, over a connection you opened yourself; opens and closes nothing                                   |

### Typed errors — `@lcabrera/server/errors/*`

| Import                              | What it does                                                                  |
| ----------------------------------- | ----------------------------------------------------------------------------- |
| `map-db-error.util`                 | SQLSTATE → a typed error; returns an already-translated one unchanged         |
| `persistence.error`                 | `PersistenceError` — the base class and the fallback                          |
| `unique-constraint-violation.error` | `23505`; `fields.constraint` names the index                                  |
| `foreign-key-violation.error`       | `23503`; `fields.constraint` tells the insert and delete directions apart     |
| `query-canceled.error`              | `57014`; the statement was stopped, by `statement_timeout` or a cancel        |
| `grouping-refused.error`            | A grouped read this package refused, with a `reason`; not a driver error      |
| `to-serializable-db-error.util`     | Anything thrown → `SerializableDbError`, plain data safe to put in a response |
| `has-postgres-error-code.util`      | Narrows `unknown` to a pg rejection with any SQLSTATE you name                |
| `errors.types`                      | `PgErrorFields` — the `code`/`column`/`constraint` a translated error carries |

### Column filters — `@lcabrera/server/filters/*`

The contract a table filter UI speaks, and the mappers that translate it into
`QueryFilter[]`. Table-agnostic — any table's filter state maps through
`toQueryFilters`.

| Import                         | What it does                                                        |
| ------------------------------ | ------------------------------------------------------------------- |
| `filters.types`                | `ColumnFilter` and its members, re-exported from `@lcabrera/api`    |
| `to-query-filters.util`        | Dispatches a `Record<column, ColumnFilter>` to the per-type mappers |
| `to-date-query-filters.util`   | Date filter → `gt`/`lt`/`eq`, or `gte`+`lte` for `between`          |
| `to-number-query-filters.util` | Number/currency filter → comparison operators                       |
| `to-text-query-filters.util`   | Text filter → `ilike`/`notIlike` patterns and `eq`/`neq`            |
| `to-select-query-filters.util` | Select/multi-select → `in`/`eq`/`neq`                               |

### Request sort — `@lcabrera/server/sort/*`

The same boundary for sorting: the `{ columnKey, direction }` shape a paginated
request carries, and the mapper into the `QuerySort[]` the builders consume.

| Import                    | What it does                                                                                         |
| ------------------------- | ---------------------------------------------------------------------------------------------------- |
| `sort.types`              | `ColumnSort` — the request-sort shape                                                                |
| `resolve-query-sort.util` | Request sort, or a fallback when it is empty → non-empty `QuerySort[]`; refuses to yield no ORDER BY |

### Table pages — `@lcabrera/server/table-page/*`

One table declared once, and the reads and request handlers bound to it. The
handlers take a Web `Request` and return a `Response`, so they need no
framework.

| Import                           | What it does                                                                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `create-table-page-reader.util`  | Schema, table, columns and primary key in → `selectPage`, `resolvePageRead` and the rest, a `pageLoader` and a grid `source`; every limit has a default |
| `create-table-page-loader.util`  | A reader's `resolvePageRead` and `selectPage` → `({ request }) => Promise<Response>` with the page                                                      |
| `parse-table-page-params.util`   | `limit`/`skip`/`cursor`/`filter`/`sort` search params → the params, or a refusal of the `filter`                                                        |
| `create-row-delete-action.util`  | `({ request }) => Promise<Response>` that deletes the row a `{ intent: 'delete', id }` form names                                                       |
| `create-table-loader-reads.util` | The first page's read for a table, from its sort, filters and grouping                                                                                  |
| `create-group-detail-reads.util` | The reads for a page that opens one group's rows                                                                                                        |
| `to-integer-row-id.util`         | A form value → a positive safe integer, or `undefined`                                                                                                  |
| `to-refused-table-page.util`     | The empty page that carries a refusal message instead of rows                                                                                           |
| `to-keyset-cursor.util`          | A client cursor → `QueryCursor` when it matches the sort and ends on a unique column, else offset                                                       |
| `table-page.types`               | `TablePage`, `TablePageRead`, `TablePageTarget` and the other shapes the factories share                                                                |

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

### Serve a grid from a table by name

```ts
import { createTablePageReader } from '@lcabrera/server/table-page/create-table-page-reader.util';

export const orders = createTablePageReader<Order, 'id'>({
  pagePath: '/orders/page',
  primaryKey: 'id',
  target: {
    allowedColumns: ['id', 'country', 'placed_on', 'total'],
    schema: 'sales',
    table: 'orders',
  },
});
```

`orders.pageLoader` is the `loader` of the resource route at `pagePath`, and
`orders.source` is the setting `@lcabrera/ui`'s `createTableRouteLoader` takes;
that package's README shows the route and the view. `allowedColumns` is the
whole surface a request can reach — the query builder rejects a filter, sort or
cursor naming any other column before a statement is built.

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

### Sort a page by what the request asked for

A paginated request carries `{ columnKey, direction }` rules; `selectRows` wants
`{ column, direction }`. `resolveQuerySort` renames them and substitutes your
endpoint's default when the request sorted by nothing.

```ts
import { resolveQuerySort } from '@lcabrera/server/sort/resolve-query-sort.util';

const DEFAULT_SORT = [{ columnKey: 'id', direction: 'asc' }] as const;

const rows = await selectRows<Order>({
  allowedColumns: ['id', 'country', 'total'],
  fields: ['id', 'country'],
  limit: 50,
  offset: 0,
  schema: 'sales',
  sort: resolveQuerySort({ fallback: DEFAULT_SORT, sorting }), // ← sorting: from the request
  table: 'orders',
});
```

The result is never empty, and that is the reason to use it rather than a
two-line rename. A paginated read with no ORDER BY leaves row order unspecified,
so pages repeat and skip rows whenever the planner changes its mind between
requests — a bug that reads as data corruption and only shows up under load. An
empty `fallback` throws here instead of reaching the database.

### Handle a constraint violation without leaking your schema

A `pg` error message names your tables, columns and indexes, and its `detail` line
quotes the values that collided. Every executor translates one before it reaches
you, so what you catch is typed and safe to act on:

```ts
import { insertRow } from '@lcabrera/server/db/insert-row.util';
import { UniqueConstraintViolationError } from '@lcabrera/server/errors/unique-constraint-violation.error';

try {
  await insertRow({ schema: 'sales', table: 'orders', values });
} catch (error) {
  if (error instanceof UniqueConstraintViolationError) {
    // `constraint` is the index Postgres refused — map it to the field that owns it.
    return { field: fieldForConstraint(error.fields.constraint), ok: false };
  }
  throw error;
}
```

The message on a translated error is ours, not the driver's; the original stays on
`error.cause` for your server logs. `PersistenceError` is the base class, so one
`instanceof PersistenceError` catches every translated failure.

These are **classes**, so they are server-side only. If you are on a framework
that serialises loader/action results — React Router single fetch, for one —
convert to plain data before returning; class instances lose their methods
silently.

### Make a read-then-write atomic

```ts
import { getMaxValue } from '@lcabrera/server/db/get-max-value.util';
import { insertRow } from '@lcabrera/server/db/insert-row.util';
import { withTransaction } from '@lcabrera/server/db/with-transaction.util';

const order = await withTransaction({
  run: async (tx) => {
    const maxId = await getMaxValue({
      column: 'id',
      schema: 'sales',
      table: 'orders',
      tx,
    });

    return insertRow({
      schema: 'sales',
      table: 'orders',
      tx,
      values: { ...values, id: maxId + 1 },
    });
  },
});
```

Two things to know. **Pass `tx` to every step** — an executor called without it
uses the pool singleton, so it runs on a different connection, outside your
transaction, and commits on its own. And **a transaction alone does not close a
read-then-write race**: under READ COMMITTED two sessions can still read the same
`MAX`. Take a lock (`pg_advisory_xact_lock`) or retry on the typed `23505`; better
still, give the column a sequence.

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

## Serve an HTTP API

This package and `@lcabrera/utils` are enough to put an HTTP API over a Postgres
table. No interface package is involved: you do not install `@lcabrera/ui` or
any component library, and you do not need a web framework. `@lcabrera/api`
installs with this package, because it declares the filter shapes a request
carries, but the example below does not import it.

```bash
npm install @lcabrera/server @lcabrera/utils
```

Install `@lcabrera/utils` directly even though this package depends on it: the
example imports it, and a strict package manager such as pnpm does not let you
import a dependency you did not declare.

The example is two files. `api.ts` is the endpoint, a function from a Web
`Request` to a `Response`, which is the shape Node, Deno, Bun and most routers
can call. `server.ts` serves it with `node:http`. The pool opens on the first
query, configured from `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` and
`DB_PASSWORD` (`readEnvConfig` in `db/env.schema` lists the optional pool
settings).

```ts
// api.ts
import { insertRow } from '@lcabrera/server/db/insert-row.util';
import { toSerializableDbError } from '@lcabrera/server/errors/to-serializable-db-error.util';
import { UniqueConstraintViolationError } from '@lcabrera/server/errors/unique-constraint-violation.error';
import { createTablePageLoader } from '@lcabrera/server/table-page/create-table-page-loader.util';
import { createTablePageReader } from '@lcabrera/server/table-page/create-table-page-reader.util';
import { isObject } from '@lcabrera/utils/guards/is-object.util';
import { safeJsonParse } from '@lcabrera/utils/json/safe-json-parse.util';

type Item = {
  readonly id: number;
  readonly name: string;
  readonly status: string;
};

const TARGET = {
  allowedColumns: ['id', 'name', 'status'],
  schema: 'catalog',
  table: 'items',
};

const items = createTablePageReader<Item, 'id'>({
  defaultLimit: 50,
  fallbackSort: [{ columnKey: 'id', direction: 'asc' }],
  groupMaxRows: 5000,
  maxLimit: 500,
  primaryKey: 'id',
  target: TARGET,
});

const readItemsPage = createTablePageLoader(items);

const STATUS_BY_KIND = {
  'db-canceled': 503,
  'db-failed': 500,
  'grouping-refused': 422,
  unexpected: 500,
} as const;

const toErrorResponse = (thrown: unknown) => {
  const error = toSerializableDbError(thrown);
  const status =
    thrown instanceof UniqueConstraintViolationError
      ? 409
      : STATUS_BY_KIND[error.kind];

  return Response.json({ error }, { status });
};

const readNewItem = async (request: Request) => {
  const body = safeJsonParse(await request.text());

  return isObject(body) && typeof body.name === 'string'
    ? { name: body.name, status: 'draft' }
    : undefined;
};

const createItem = async (request: Request) => {
  const values = await readNewItem(request);

  if (values === undefined) {
    return Response.json(
      { error: { kind: 'invalid-body', message: 'Send { "name": string }.' } },
      { status: 400 },
    );
  }

  const [item] = await insertRow<Item>({ ...TARGET, values });

  return Response.json(item, { status: 201 });
};

const route = async (request: Request) => {
  switch (request.method) {
    case 'GET': {
      return readItemsPage({ request });
    }
    case 'POST': {
      return createItem(request);
    }
    default: {
      return new Response(undefined, {
        headers: { allow: 'GET, POST' },
        status: 405,
      });
    }
  }
};

export const handle = async (request: Request) => {
  if (new URL(request.url).pathname !== '/items') {
    return new Response(undefined, { status: 404 });
  }

  try {
    return await route(request);
  } catch (error) {
    console.error(error);

    return toErrorResponse(error);
  }
};
```

```ts
// server.ts
import type { IncomingMessage, ServerResponse } from 'node:http';

import { closePool } from '@lcabrera/server/db/get-pool.util';
import { parsePositiveInteger } from '@lcabrera/utils/numbers/parse-positive-integer.util';
import { createServer } from 'node:http';
import { text } from 'node:stream/consumers';

import { handle } from './api.ts';

const toRequest = async (incoming: IncomingMessage) => {
  const url = new URL(incoming.url ?? '/', 'http://localhost');
  const method = incoming.method ?? 'GET';
  const hasBody = method !== 'GET' && method !== 'HEAD';

  return new Request(url, {
    method,
    ...(hasBody && { body: await text(incoming) }),
  });
};

const serve = async (incoming: IncomingMessage, outgoing: ServerResponse) => {
  try {
    const response = await handle(await toRequest(incoming));

    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(await response.text());
  } catch {
    outgoing.destroy();
  }
};

export const server = createServer((incoming, outgoing) => {
  void serve(incoming, outgoing);
});

server.listen(
  parsePositiveInteger({ fallback: 3000, value: process.env.PORT }),
);

process.once('SIGTERM', () => {
  server.close(() => {
    void closePool();
  });
});
```

`GET /items` reads the search params a paginated request already uses:
`limit`, `skip`, `cursor`, `sort` and a JSON `filter`. It answers
`{ data, hasMore }`, plus `total` on the first page. Page size is clamped to
`maxLimit`, and a request that sorts by nothing gets `fallbackSort`. A `filter`
the package cannot read, or one it refuses, gets a 200 with an empty page whose
`error` says why. It never becomes a read of the whole table. `POST /items`
inserts a row and returns it. `toRequest` passes on the method, the URL and the
body, which is all these two routes read; pass `incoming.headers` through as
well if your handler reads a header.

### The error contract

A raw driver error never reaches a response. A `pg` error message names your
tables, columns and indexes, and its `detail` line quotes the values that
collided, so three steps keep it out:

1. Every executor translates a driver rejection into a `PersistenceError`
   subclass before your code sees it. Its message is written by this package;
   the driver's error stays on `cause`.
2. `toSerializableDbError` turns whatever was thrown into plain data: a `kind`,
   that message and, for a database failure, the SQLSTATE `code`. Anything it
   does not recognise, your own code's errors included, becomes `unexpected`
   with a fixed message.
3. `handle` catches everything `route` throws and puts only that plain data in
   the body. The full error, `cause` included, goes to the server log.

The status codes are this example's choice, not the package's: 409 for a
unique-key conflict, 503 when `statement_timeout` stopped the query, 422 for a
grouped read the package refused, and 500 for anything else.

The example attaches no `error` listener to the pool: `getPool` attaches its
own, so an idle connection that fails is dropped and reported as a process
warning rather than stopping the server (see Guarantees below).

One gap in the package shows in the example, and it has an issue open. A request
that filters or sorts on a column `allowedColumns` does not list is refused with
a plain `Error`, so it answers 500 `unexpected` where a 4xx is due. The column
name still stays out of the body.
[#1524](https://github.com/luciocabrera/lcabrera-stack/issues/1524) tracks a
typed refusal.

## Guarantees

- **Node-only, enforced by the compiler** — no DOM lib, so browser globals fail
  typecheck.
- **No unfiltered mutations** — `buildUpdateQuery` and `buildDeleteQuery` require
  at least one filter and throw without one.
- **No raw driver errors escape** — every executor translates a `pg` rejection
  into a typed error carrying a message of ours; the driver's stays on `cause`.
- **Identifiers validated, values parameterised** — always, with an opt-in
  allow-list for request-derived column names.
- **A bounded pool** — `DB_POOL_MAX`, `DB_CONNECTION_TIMEOUT_MS`,
  `DB_IDLE_TIMEOUT_MS` and `DB_STATEMENT_TIMEOUT_MS` are optional and defaulted, so
  connection acquisition and statement duration are bounded out of the box rather
  than waiting forever.
- **An idle connection that fails does not stop the process** — `pg` emits
  `error` on the pool when a connection sitting idle in it drops, and an
  unhandled `error` event would throw. `getPool` attaches a listener, so the pool
  discards the connection and the next query opens a new one. While no other
  listener is attached, the failure surfaces as a process warning with code
  `LCABRERA_SERVER_POOL_IDLE_ERROR` (observe it with `process.on('warning', …)`).
  Attach your own with `getPool().on('error', …)` to receive the error itself;
  the warning is then left to you.
- **Pure builders, isolated execution** — `query-builder/` never touches a
  connection.
- **Published as compiled ESM** (`.mjs` + `.d.mts`) with source maps and
  `"sideEffects": false`, mirroring the source tree one file per module.
- **95% coverage gate** — the build fails below it.

## Links

- [Repository](https://github.com/luciocabrera/lcabrera-stack) ·
  [this package's source](https://github.com/luciocabrera/lcabrera-stack/tree/main/packages/server)
- [Changelog](https://github.com/luciocabrera/lcabrera-stack/blob/main/packages/server/CHANGELOG.md)
- Companion packages: [`@lcabrera/utils`](https://www.npmjs.com/package/@lcabrera/utils)
  (pure helpers), [`@lcabrera/api`](https://www.npmjs.com/package/@lcabrera/api)
  (the browser half), [`@lcabrera/ui`](https://www.npmjs.com/package/@lcabrera/ui)
  (React components)

MIT © Lucio Cabrera
