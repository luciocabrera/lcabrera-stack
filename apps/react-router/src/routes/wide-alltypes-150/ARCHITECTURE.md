# Wide Alltypes 150 Route Architecture

This route is the baseline stress-test page for the `wide_alltypes_150`
dataset — 150 columns covering every major PostgreSQL type, 1,000,000 rows. It
stays on the shared `TableLayout` architecture used elsewhere in the app and
acts as the reference implementation for the same dataset.

## Goals

- Serve its own rows, so the showcase renders with nothing running but Postgres.
- Preserve the shared table feature set: persistence, URL state, sorting, and
  infinite loading.
- Keep the established `/wide-alltypes-150` route stable while sibling
  experiments can live on separate URLs.

## Files

```text
wide-alltypes-150/
├── ARCHITECTURE.md
├── .server/
│   └── wideAlltypes150.service.ts     # Postgres access + the data-source choice
├── config/
│   ├── wideAlltypes150.constants.ts   # schema/table/columns/sortable set/limits
│   ├── serializeDatabaseValue.util.ts # one driver value → its JSON rendering
│   ├── toHexString.util.ts            # bytes → lowercase hex
│   ├── toWideAlltypes150Row.util.ts   # driver row → the shape the table reads
│   └── index.ts
├── WideAlltypes150.component.tsx
├── WideAlltypes150.constants.ts
├── WideAlltypes150.error-boundary.tsx
├── WideAlltypes150.layout.tsx
├── wide-alltypes-150.loader.ts
├── wide-alltypes-150.meta.ts
├── layout.ts
└── root.ts
```

## Data Flow

1. `wide-alltypes-150.loader.ts` restores persisted table state from URL params
   and cookies into loader-seeded `columnsState` and `metaState`. `COLUMNS`
   is fully serializable (no functions — ADR-009), so the loader returns it
   directly inside `columnsState`; no distinct filter descriptors are
   appended here (this route's filter support is deliberately minimal).
2. It calls **`readWideAlltypes150Page`** (`.server/wideAlltypes150.service.ts`)
   for the first page and returns the promise unawaited for Suspense streaming.
3. `WideAlltypes150.component.tsx` renders `TableRouteView`, which reads the
   loader-seeded state and wires load-more to `fetchWideAlltypes150Page`. The
   loader declares neither `isKeysetEnabled` nor `isServerFilterEnabled` on its
   `meta` — this endpoint supports neither, and absent means off (ADR-063) — so
   the load-more carries `limit`, `skip` and `sort` only.
4. Those later pages come from **`GET /_api/wide-alltypes-150/paginated`**
   (`routes/api/wide-alltypes-150-paginated/`), whose loader calls the same
   `selectWideAlltypes150Page` the SSR loader reached directly.
5. `TableLayout`, beneath it, owns rendering, persistence, sorting, and
   incremental loading.

No API server is involved (#687). Building with `VITE_API_URL` set sends both
halves to the external endpoint instead; the response shape is identical either
way — with one documented exception, the `c_018` sort below. That switch is
resolved at **build** time: setting the variable for a server that is already
built does nothing, silently. See
[`docs/data-sources.md`](../../../docs/data-sources.md).

## Reading 20 Postgres types through one grid

`selectWideAlltypes150Page` composes the generic `@lcabrera/server` executors
(`selectRows` + `getRowsCount`) with no entity-specific SQL, and three things
about it are deliberate:

- **The sort is narrowed before it reaches the builder.** `c_018` is `point`,
  which has no btree ordering, so Postgres rejects the entire query rather than
  that one term — the column stays perfectly selectable, only ordering is
  refused. The remaining terms are then capped at `MAX_WIDE_ALLTYPES_SORT_RULES`.
  This lives in the service rather than in the resource route's parser because
  the SSR loader does not go through that parser and needs the same narrowing.
- **`toWideAlltypes150Row` renders each value the way JSON renders it** — hex
  for `bytea`, JSON text for `jsonb`, `interval` and `point`, arrays left alone.
  The resource route's `Response.json` would do this anyway; the SSR loader
  would not, so without the step the first page and every load-more page after
  it would reach the grid in different shapes. A `Date` goes through
  `JSON.stringify` here too, quotes included — that is what this table has
  always displayed for its date columns, and changing it is a change to what the
  route renders.
- **The count runs on every page**, because the endpoint this replaced always
  answered a `total` and this route's table reads one from every page. It runs
  concurrently with the page query rather than after it.

## The one place the two data paths disagree: sorting `c_018`

Everywhere else the self-hosted and external endpoints are interchangeable. On
a sort naming **`c_018`** (`Point 18`) they are not, and the column's header is
clickable — `WideAlltypes150.constants.ts` sets `isSortable: mod !== 19`, which
excludes only the `integer[]` columns, so `point` is offered.

| Request                                                                        | External (built with `VITE_API_URL`)                                         | Self-hosted (default)                               |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- | --------------------------------------------------- |
| `…/wide-alltypes-150/paginated?sort=[{"columnKey":"c_018","direction":"asc"}]` | `400` — `{"error":"Unsupported wide-alltypes sort column: c_018"}`           | `200` — a normal page, ordered by the `id` fallback |
| `/wide-alltypes-150?sorting={"c_018":"asc"}`                                   | HTTP `500`; the error boundary renders `API request failed: 400 Bad Request` | HTTP `200`; the table renders                       |

The external endpoint **rejects** a sort it cannot serve; this one **drops the
term** and falls back to the primary key. That is deliberate and it is the
forgiving direction — a clickable header that returns rows beats one that
replaces the page with an error — but it is a behavioural difference, not a
detail: a user who clicks `Point 18` sees the table re-render apparently
unsorted rather than being told the column cannot be ordered.

Neither behaviour is the one this route ideally wants, which is for the header
not to offer the sort at all. Making `isSortable` exclude `point` as well as
`integer[]` is the real fix and it changes what the route renders, so it belongs
in its own change rather than in the one that moved the data source (#687 §5).
Until then, the divergence is the documented cost of the move.

## Guardrails

- Keep this route on the shared table stack so it remains the baseline for
  comparisons.
- Reuse the original column configuration and persistence key.
- Add experimental table implementations as sibling routes instead of replacing
  this URL.
- Generated columns are filterable by default except `Bytea`, `Point`, and
  `Int[]` columns to keep filter option fetching practical.
- `config/` holds **plain data and pure rules only** — no SQL, no `pg`. Its
  column list is copied, not imported, from the api layer
  ([ADR-039](../../../../../docs/decisions/ADR-039-duplicate-over-undeclared-edges.md)).
- `.server/` is a React Router server-only directory: the build fails if
  client-reachable code imports it. Import it only from loaders and actions.
