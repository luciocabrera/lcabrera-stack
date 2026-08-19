# ADR-081 — OLAP is a Table feature, so its seam lives in the packages

- **Status:** Accepted
- **Date:** 2026-08-19
- **Scope:** `@lcabrera/api` — the OLAP wire vocabulary and its codec; `@lcabrera/server` — drill translation and the `GROUPING()` mask decode; `apps/react-router` — what is left behind
- **Issue:** #777 — unblocks its rendering half; retrospectively corrects #776
- **Extends:** [ADR-038](./ADR-038-public-package-topology-by-runtime.md) — allocates a new seam across the same runtime split
- **Narrows:** [ADR-039](./ADR-039-duplicate-over-undeclared-edges.md) — nothing it decided changes; this records the case it always permitted
- **Related:** [ADR-009](../../apps/react-router/docs/decisions/ADR-009-serializable-filter-options-descriptors.md) (the descriptor pattern this reuses), [ADR-058](./ADR-058-grouping-legality-by-analytical-role.md), [ADR-059](./ADR-059-aggregation-is-builder-generated.md), [ADR-063](./ADR-063-request-shaping-capabilities-on-the-loader-meta.md), [ADR-079](./ADR-079-drilling-from-a-group-to-its-rows.md), [ADR-080](./ADR-080-a-group-key-renders-in-its-own-column.md)

## Context

The OLAP work has been landing at both ends and meeting in the middle. The query
engine went into `@lcabrera/server/db/group-query-builder` — grouping-set
expansion for rollup and cube, the `GROUPING()` mask, cardinality guard rails,
per-column capability and key refusals. The grid went into
`@lcabrera/ui/components/Table` — the group tree, expansion as the collapsed set
(ADR-067), a group key in its own column (ADR-080), the drilled-row splice
(ADR-079).

Both ends are in the product. The **seam** between them is not: it was written
into `apps/react-router/src/routes/enterprise-orders`, one file at a time, each
named after the domain it happened to be serving.

## Problem

Grouping, rollup, cube and drill are features of a table, in the same sense that
sorting, filtering and pagination are. Nothing about them is specific to
enterprise orders — and the code says so plainly. Grepping the four seam files
for any domain identifier at all, on the day this was written:

| File                                                        | Domain identifiers                                                                    |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `config/toOrderGroupRow.util.ts`                            | none                                                                                  |
| `config/toOrderGroupLabel.util.ts`                          | none                                                                                  |
| `api/enterprise-orders-drill/parseOrderDrillParams.util.ts` | none                                                                                  |
| `.server/toOrderDrillRead.util.ts`                          | `ENTERPRISE_ORDER_PRIMARY_KEY`, `MAX_ENTERPRISE_ORDERS_LIMIT`, `SelectOrdersPageArgs` |

Three mention no order anywhere. The fourth mentions one three times, and each is
a parameter wearing a constant's clothes: a primary key, a page ceiling, and the
argument type of the read it produces. `toOrderGroupRow` decodes a `GROUPING()`
bitmask — the OLAP protocol, named after a domain it never references.

**A name that claims a domain the code does not have is the failure mode here,
not a cosmetic one.** It is why these files were written in the app twice without
anyone noticing: the second author was not looking for `toOrderDrillRead` when
they needed a drill translation, because the name promised something narrower
than what it held.

The concrete cost is a second consumer. Everything in the table above is code a
second app — or an external consumer of `@lcabrera/ui`, which is the point of
publishing it — must write again from scratch, against an engine that is already
sitting in a package it already depends on.

**And one of them is worse than duplicated: it is a half.** The drill request's
`group` parameter is encoded in the browser and decoded on the server. The
encoder does not exist yet; the decoder is `parseOrderDrillParams`. Placing the
two in different workspaces makes a **codec** the thing that is duplicated —
behaviour, not a shape — and structural typing offers nothing to a codec. Where
`sort/` and `filters/` duplicate a type and let assignability catch drift, a
JSON encoder and its parser can disagree in any way at all and still compile.

## Options considered

1. **Leave it.** The app is the only consumer today, and ADR-039 has a standing
   preference for duplication over cross-package edges.
2. **Give the Table the whole engine** — pass it a schema name, a table name and
   the column config, flip an `isOlapEnabled` flag, and let it drive.
3. **Move the seam into the packages**, allocated by runtime, and let the app
   keep only what is genuinely its own.

Option 2 is the one worth spelling out, because it is the natural reading of "it
is just a table feature" and it cannot be built. `@lcabrera/ui` is browser-safe:
its tsconfig omits `node` types and `check:public-api` gates its dependency
graph, precisely so that a consumer wanting a Table does not receive the Postgres
driver (ADR-038). A component that turns a schema and table name into rows is a
component that reaches a database. The flag is a good idea; the transport is the
part that cannot live there.

The Table also does not know the app's routes, its authentication, or its
transport — and it cannot be handed a function that does, because functions do
not survive the loader boundary (ADR-009, which found this the hard way when
single-fetch encoding replaced them with `undefined` and no warning).

## Decision

**The OLAP seam belongs to the packages, allocated across the same runtime split
as everything else (ADR-038).**

- **`@lcabrera/api`** owns the wire vocabulary and its **codec** — the `group`
  parameter encoded and decoded in one module, plus the response guard. Both
  sides import the same code, so the encoder and the parser cannot disagree.
- **`@lcabrera/server`** owns the translation from a group row to a paginated
  read, and the `GROUPING()` mask decode — the latter placed beside the builder
  that _writes_ the mask, since the two are one protocol and were never
  separable by anything but accident.
- **`@lcabrera/ui`** owns the grid behaviour it already owns, and learns what is
  available the way it already does: a **capability on loader meta** (ADR-063)
  and a **serializable descriptor** naming where to ask (ADR-009). This is what
  `isOlapEnabled` becomes — the flag, without the database.
- **The app** keeps route registration, its own resource configuration (schema,
  table, primary key, columns) and the cross-package contract tests, which can
  only live where both packages are legal dependencies.

**`@lcabrera/server` may declare a dependency on `@lcabrera/api`.**

### Why this does not overturn ADR-039

ADR-039's decision is a requirement, not a prohibition:

> A package must stand on its own: declared dependencies, a resolvable public
> surface, and no reliance on a consumer's tsconfig `paths` to make an import
> work.

What it refused was an **undeclared** edge — `@repo/ui` importing
`@repo/server/filters` through a tsconfig alias that resolved in this repo and
nowhere else — and it refused the obvious fix because declaring _that_ edge would
have put the Postgres driver back in the browser's dependency graph.

Neither holds here. The edge is declared, so it resolves for an external
consumer. It runs Node → browser-safe, which is the harmless direction:
`@lcabrera/api` declares no dependencies of its own, so `@lcabrera/server` gains
nothing it did not already have.

ADR-039 also weighed and rejected "a third shared package holding the contract"
as _correct and disproportionate_ — a new workspace's fixed cost around 58 lines
of types. That objection is not available here either, because no new workspace
is created: `@lcabrera/api` already exists, is already published, and is already
a declared dependency of `@lcabrera/ui`.

The duplicated shapes ADR-039 governs — the column filters, the sort, the
grouping vocabulary — are **not** consolidated by this. They stay duplicated, and
`groupingContract.test.ts` stays where it is. This decision is about the codec
and the translation, which are behaviour.

## Consequences

- A second consumer gets grouping, rollup, cube and drill from the packages, and
  writes only its own resource configuration.
- The drill action hook in `@lcabrera/ui` can import the encoder directly rather
  than receiving one across the loader boundary, which is what makes ADR-079's
  rendering half implementable without a workaround.
- `@lcabrera/server` acquires its first `@lcabrera/*` dependency. Its manifest,
  its generated tsconfig and the API-surface report all move with it.
- The app's `.server/` grouping files shrink to route wiring. The contract tests
  do not move — they are the one thing that legitimately requires both packages.
- Anything named `toOrder*` that never mentions an order is renamed on the way,
  because the name is what hid this.

## Alternatives considered

**Keep the codec in the app and pass an encoder into the Table.** This is the
shape ADR-009 already rejected for filter options: functions are silently dropped
by single-fetch encoding, and the resulting `undefined` surfaces far from its
cause. Descriptors exist because of it.

**Put the codec only in `@lcabrera/ui` and let the server restate it.** Follows
the `sort/` precedent exactly, and costs nothing today. Rejected because the
thing being restated is a parser, and a parser that drifts from its encoder
produces a refused request rather than a type error — the failure lands at
runtime, on the user's click, and looks like a server bug.

**Wait for the second consumer.** The second consumer is the reason
`@lcabrera/ui` is published at all. Waiting would mean shipping a Table whose
advertised OLAP support requires the consumer to reimplement the half that talks
to it.

## References

- The measurement in the Problem table is reproducible: grep each file for
  `ENTERPRISE_`, `MAX_`, `SelectOrdersPageArgs`, `enterprise_orders`, `orderId`
  and `EnterpriseOrder` — the probe is in #777's discussion.
- [ADR-038](./ADR-038-public-package-topology-by-runtime.md) — the runtime split
  this allocates across
- [ADR-039](./ADR-039-duplicate-over-undeclared-edges.md) — what stays duplicated
  and why this is not that case
- [ADR-079](./ADR-079-drilling-from-a-group-to-its-rows.md) — the drill this
  serves, and its four states
