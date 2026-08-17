# Planning session — grid row grouping (2026-08)

> **The backlog is on GitHub.** This is the dated synthesis of the session that
> produced the design, kept for the reasoning and the measurements GitHub does
> not hold. Status, milestones and acceptance criteria belong on the issues —
> that is what [ADR-036](../../decisions/ADR-036-github-planning-layer.md) makes
> canonical, so nothing here restates them.
>
> Every Postgres claim below was probed against the live local instance
> (PostgreSQL 18.4, `car_sales_db`, `public.enterprise_orders`, 500 000 rows).
> Probes that could have disproved a claim are quoted with their output; where a
> probe corrected an earlier conclusion, both are kept.

## Context

The grid in `@lcabrera/ui` supports pinning, sorting, filtering, resizing and
hiding. This plans **row grouping** in two modes — consumer-declared presets
(Mode 1) and runtime, schema-aware group-by with generated SQL (Mode 2) — across
simple / rollup / cube aggregation.

Investigation found that three premises of the original brief do not hold, and
this design is built on what is in the tree rather than what was assumed. Six
decisions were settled before designing:

| Decision              | Resolution                                                                                                                                |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Descriptor foundation | Adopt `CommandDescriptor` + `deriveToggleCommandState` **unchanged**; grouping becomes the first capability to actually feed `isDisabled` |
| Schema metadata       | No `information_schema` introspection — and per §2.2, no new hand-declared metadata either                                                |
| SQL home              | New `group-query-builder` module, a sibling of `packages/server/src/db/query-builder/` rather than an extension of it                     |
| A11y                  | Grid focus model ships as an independent Slice 0, then upgrades to `treegrid`                                                             |
| Scope                 | **Every table route gets grouping.** Generic like filtering and sorting, driven off column data types, with a `crud`-style opt-in flag    |
| Totals placement      | User-configurable in table settings, like the existing pinning-conflict handling — not a hardcoded design call                            |

---

## 1. Findings

### 1.1 Package topology

`pnpm-workspace.yaml` globs `apps/*` + `packages/*` — 17 workspaces.

| Concern            | Owner                                                                                                                                                                      |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Data grid          | `@lcabrera/ui` — [`packages/ui/src/components/Table/`](../../../packages/ui/src/components/Table/) (published, ships **source** not `dist`, for StyleX path identity)      |
| Query construction | `@lcabrera/server` — [`packages/server/src/db/query-builder/`](../../../packages/server/src/db/query-builder/) — hand-rolled pure functions over raw `pg`, no ORM          |
| Schema metadata    | The **apps**, as hand-declared constants — [`enterpriseOrders.constants.ts`](../../../apps/react-router/src/routes/enterprise-orders/config/enterpriseOrders.constants.ts) |
| Route/loader layer | Factory in `@lcabrera/ui` ([`packages/ui/src/routing/`](../../../packages/ui/src/routing/)); call sites in `apps/react-router`                                             |

**The binding constraint:** `@lcabrera/ui` is browser-safe and may **not** depend
on `@lcabrera/server` ([ADR-038](../../decisions/ADR-038-public-package-topology-by-runtime.md)),
enforced by `check:public-api`. Shapes needed on both sides are **duplicated**,
never imported across, held in step by a conformance test in the app
([ADR-039](../../decisions/ADR-039-duplicate-over-undeclared-edges.md),
[`filterContract.test.ts`](../../../apps/react-router/src/routes/enterprise-orders/filterContract.test.ts)).
That test uses a `: Record<string, T>` **annotation** — `satisfies` preserves
literal types and silently defeats the check.

### 1.2 Capability descriptors — thinner than the brief assumes

There is **no `Capability` type**.
[`commands.types.ts`](../../../packages/ui/src/components/Table/commands/commands.types.ts)
is the whole surface:

```ts
export type CommandDescriptor = {
  readonly icon: ComponentType<IconProps>;
  readonly id: CommandId;
  readonly label: string;
};
export type CommandId = string & { readonly __brand: 'CommandId' };
```

- Only **pinning** and **sorting** have descriptors. **Filtering has none** — no
  `commands/filtering/`, no header-menu surface, local literals plus hand-rolled
  `!== undefined` predicates in its toolbars.
- "Centralized enablement derivation" is one 26-line pure function,
  [`deriveToggleCommandState.util.ts`](../../../packages/ui/src/components/Table/commands/deriveToggleCommandState.util.ts).
  **`isDisabled` is hardcoded `false` at all 8 production call sites** — the
  availability seam exists and nothing feeds it.
- Availability (`isFilterable`/`isSortable`/`isStatic`) is re-derived ad hoc with
  `!== false` in 8+ files, never through that function.
- **No registry** — deliberately deferred by
  [ADR-011](../../../apps/react-router/docs/decisions/ADR-011-grid-interaction-architecture.md).

The rule for a new capability, `commands/ARCHITECTURE.md`: _"A new capability adds
a sibling `*Commands.ts`. If it cannot reuse `deriveToggleCommandState` or
`CommandDescriptor` unchanged, revise the shared shape before adding it."_
Grouping reuses both unchanged (§3.2).

### 1.3 Schema metadata — hand-declared, no introspection, no nullability

Repo-wide grep for `information_schema|pg_catalog|udt_name|is_nullable` over TS
returns **zero** runtime hits. No build-time codegen. What exists is per-entity
constants (`*_SCHEMA`, `*_TABLE`, `*_PRIMARY_KEY`, `*_COLUMNS`,
`*_ALLOWED_COLUMNS`) plus two coarse, **different** type vocabularies:

```ts
// packages/server/src/db/query-builder/query-builder.types.ts:23
export type ColumnType = 'boolean' | 'date' | 'enum' | 'number' | 'text';
// packages/ui/src/components/Table/Table.types.ts:201-206
export type TableColumnDataType =
  'boolean' | 'currency' | 'date' | 'number' | 'string';
```

**Nullability is not modeled anywhere.** Schema/table names live on table _meta_
(`TableMetaState.schemaName`/`tableName`), not per column.

### 1.4 Filter → SQL, and the identifier boundary

Two-layer identifier defense in
[`packages/server/src/db/query-builder/`](../../../packages/server/src/db/query-builder/):

```ts
const SAFE_IDENTIFIER_PATTERN = /^[a-z_][a-z0-9_]*$/;   // mandatory, no opt-out, LOWERCASE ONLY
if (allowedColumns === undefined) return;                // opt-in allowlist
if (!allowedColumns.includes(column)) throw new Error(...);
`"${identifier.replaceAll('"', '""')}"`                  // quoteIdentifier
```

Values are **always** `$n`, threaded through an immutable `ClauseAccumulator` —
even `LIMIT`/`OFFSET`. `OPERATOR_SQL: Record<BinaryOperator, string>` in
`append-filter-clause.util.ts` is the map pattern to copy. The real authorization
boundary is at the service edge; the builder's checks are defense in depth.

**Three constraints that shape this design:**

1. `build-select-query.util.ts` assembles a fixed **four-part** join.
2. **`NULLS FIRST`/`NULLS LAST` is never emitted anywhere**, and
   `build-keyset-comparison.util.ts` deliberately depends on default placement.
   Emitting explicit NULLS silently breaks keyset pagination.
3. `query-builder/ARCHITECTURE.md` excludes joins, subqueries and aggregates;
   CQMS's `PRD.md` (moved to the CQMS repository in #683) says rollup belongs in Postgres
   **views**. Generating GROUP BY contradicts both — **needs an ADR**.

Zero `GROUP BY`/`ROLLUP`/`CUBE`/`GROUPING`/`HAVING` generation exists. The only
aggregates are two hardcoded strings (`count(...)`, `COALESCE(MAX(...), 0)`).

### 1.5 Loader layer

- `?sorting={"col":"asc"}` / `?filters={"col":["ct","abc"]}` — compact JSON,
  `JSON.parse` in try/catch. **Zero Zod in `packages/ui`.**
- **No `page`/`offset`/`cursor` param on the document route**; paging goes to a
  resource route with a _third_, verbose serialization.
- State changes never use `useSearchParams`/`useSubmit`. They go action-hook →
  `persistTableState` → `useFetcher` POST to `/_action/persist-cookie` → the
  action returns `redirect` (param changed) or `204` (unchanged).
  `MAX_COOKIE_ENTRY_VALUE_LENGTH = 10_000` already guards oversized writes.
- **`shouldRevalidate` exists on all four table routes** but only as
  `shouldRevalidatePersistCookieAction` — it suppresses the `204` case, nothing else.
- **Streaming already works**: unawaited `dataPromise` + React 19 `use()` inside
  `TableSuspenseBoundary`. **`<Await>` and `defer` are absent repo-wide** — do not
  introduce them.

### 1.6 Grid row model — the biggest gap

- **Row keys are the array index**: `key={rowIndex}` in
  [`TableBodyRows.component.tsx`](../../../packages/ui/src/components/Table/TableBodyRows/TableBodyRows.component.tsx).
- **Virtualization is bespoke and fixed-height** —
  `getVerticalVirtualizationWindow` computes `floor(scrollTop / itemHeight)`;
  `TableRow` pins `height`/`min`/`maxHeight` to one number.
  `TableRow/ARCHITECTURE.md` records that any row painting at a different height
  makes `<tbody>` (a CSS grid) redistribute space and rows visibly move.
- **Nested/expandable/tree/detail/group rows: 0% implemented.** Every `expand*`
  hit is the settings-drawer filter accordion. The only non-data rows are
  `SpacerRow` (`aria-hidden`, `colSpan`) and `TableEmptyState` — useful precedents.
- **No explicit ARIA table role anywhere**, and **no keyboard navigation**. The
  only `tabIndex={0}` in the table is the column `ResizeHandle`. ADR-011 calls the
  focus model _"Step 0 … the spine that row selection, grouping, and nested
  headers all ride on"_ — and it is not built.

### 1.7 Postgres semantics — verified, not assumed

> **Correction to an earlier finding in this same session.** I first reported the
> database as unseeded. That was wrong: I queried the `postgres` maintenance
> database (`POSTGRES_DB=postgres` in the container env) while the app uses
> `car_sales_db` ([`docker/local/.env.example`](../../../docker/local/.env.example)).
> The confound was the database name, not missing data. Kept per the
> "look for the confound before defending or retracting" rule.

**(a) Subtotal NULL vs real NULL** — `GROUP BY ROLLUP(order_status, shipping_country)`:

```text
 order_status | shipping_country | g_order_status | g_shipping_country | row_count | total_amount_sum
--------------+------------------+----------------+--------------------+-----------+------------------
 Pending      | US               |              0 |                  0 |         2 |               15
 Pending      | <NULL>           |              0 |                  0 |         1 |                7   <- real data
 Pending      | <NULL>           |              0 |                  1 |         3 |               22   <- subtotal
 <NULL>       | <NULL>           |              1 |                  1 |         5 |               45   <- grand total
```

Rows 2 and 3 are textually identical; only `GROUPING()` separates them.

**(b) `ROLLUP`/`CUBE` are parser sugar — identical plans.** Bidirectional
`EXCEPT ALL` between `ROLLUP(a,b)` and `GROUPING SETS ((a,b),(a),())` returned
**0 differing rows**, same for `CUBE(a,b)` vs its 4 sets. `EXPLAIN (costs off)`
returned **byte-identical** `MixedAggregate` nodes with the same hash keys for
both pairs. The alternative hypothesis ("ROLLUP plans better") would have shown
different output; it did not.

**(c) Ordering needs no explicit NULLS placement.**
`ORDER BY grouping(a), a, grouping(b), b` put the real-NULL detail row _before_
the subtotal within `Pending` and the grand total last, while real NULLs inside a
level took Postgres's default ASC⇒NULLS-LAST — exactly what the keyset code
assumes. Constraint 1.4(2) is satisfied with no special-casing.

**(d) Aggregate sort must be confined to the innermost level.**
`ORDER BY grouping(a), sum(v) DESC` scrambles the tree (P's subtotal jumps above
its own children; P and S interleave). `ORDER BY grouping(a), a, grouping(b), sum(v) DESC`
keeps the tree while sorting leaves within each parent. **But it does not rank
parents by their own totals** — P (114) still precedes S (23) by key order. See §4.4.

**(e) Guard-rail traps, all three confirmed.** `n_distinct` is **positive** for
low-cardinality columns but **negative = fraction of rows** for unique ones
(`order_id` → `-1`), so the estimator must branch on sign. A never-`ANALYZE`d
table has **no row at all** in `pg_stats` — not `n_distinct = 0`. And in PG 18
`pg_class.reltuples` is **-1** before analyze, not `0`.

**(f) `SET LOCAL statement_timeout = $1` is a syntax error.** `SET` is a utility
statement and cannot be prepared. `SELECT set_config('statement_timeout', $1, true)`
works, and `SHOW statement_timeout` returned `0` after COMMIT — **the
connection-leak test passes, proven not assumed.**

**(g) Real calibration.** A depth-4 **CUBE over 500 000 rows returned 1 422 rows
in 654 ms.** The `∏(dₖ+1)` bound predicted 3 564 — a true upper bound, but
**conservative ~2.5×** when combinations are sparse, so the guard will sometimes
refuse a query that would have been fine. That is the safe failure direction and
it argues for warn-plus-`LIMIT`-backstop over pure pre-flight refusal. Real
cardinalities are all small (`shipping_country` 3, `priority` 5, `customer_type` 5,
`warehouse_location` 5, `order_status` 8, `product_category` 10), while `order_id`
is `n_distinct = -1` and plans at **500 001 rows** — the likeliest user mistake,
caught by the uniqueness rule before any EXPLAIN.

> **Terminology correction to the brief:** Postgres has **no `GROUPING_ID`**
> function (that is Oracle/SQL Server). The bitmask form is variadic
> `GROUPING(a, b, …)`, verified returning `3` for the grand total above.
> Leftmost argument = most significant bit.

### 1.8 Blocking unknowns

None.

---

## 2. Recommended design

### 2.1 Mode 1 is a preset layer over the same engine

**One engine.** Mode 1 declares a `GroupingState` in config; Mode 2 lets the user
build the same `GroupingState` at runtime. Same type, same serializer, same
builder, same renderer — the only difference is who authored it and whether the
picker is reachable.

This is how filtering already works, and there is no "static filtering engine":
`isFilterable` + `filterOptionsDescriptor` curate what a user may do at runtime.
Grouping mirrors it — `isGroupable: false` plus a `defaultGrouping` collapses the
picker to a fixed, curated experience.

_Rejected — two mechanisms._ Two SQL paths, two serializations and two test
suites for one feature, inside a single package where no runtime boundary
justifies it. That is ADR-039's duplication cost with none of its payoff (ADR-039
duplicates across a boundary that genuinely cannot be crossed; here there is none).

### 2.2 Generic by construction — no new hand-declared metadata

Grouping must work on **every** table route, like filtering and sorting. The route
opts in with one `crud`-style flag; everything else is derived from what routes
already declare:

| Question                        | Answered from                                                             | Already exists?                                    |
| ------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------- |
| Which columns _may_ be grouped? | `TableColumn.dataType` + `isGroupable?: boolean` opt-out                  | `dataType` yes; `isGroupable` is the one new field |
| Which aggregates are legal?     | `TableColumn.dataType` (§4.2 table)                                       | yes                                                |
| Which columns may reach SQL?    | the route's existing `*_ALLOWED_COLUMNS`                                  | yes                                                |
| Is this grouping too expensive? | runtime `pg_stats` (§2.8)                                                 | new, but generic — no per-route config             |
| Is grouping on for this table?  | `TableMetaState.grouping`, set from the loader `meta` exactly like `crud` | new flag, existing mechanism                       |

So **a route enables grouping by adding `grouping: { enabled: true }` to its
loader `meta`** — nothing else. The server derives its type map from the same
`COLUMNS` the route already declares, so no second catalog can drift from the
first. This is strictly _less_ work than a per-entity grouping catalog and is what
"generic like filtering and sorting" requires.

> **Correction — this premise was falsified after the design was written, and the
> row above it ("Which aggregates are legal? → `TableColumn.dataType`") does not
> hold.** Kept rather than rewritten, per this document's rule of showing both
> sides of a corrected conclusion. `dataType` is a **UI hint that seeds the menu**;
> legality is decided by **two gates** — the column's analytical role (dimension,
> fact, or unsupported) as the bar, and the Postgres catalogue as the floor. See
> [ADR-058](../../decisions/ADR-058-grouping-legality-by-analytical-role.md)
> and issues #550 (the probe) and #563 (the implementation).
>
> What the original claim said: _"`TableColumnDataType` is coarser than `pgType`,
> and that is sufficient: it never lets an illegal aggregate be emitted (§4.2)."_
>
> Why it is wrong: the vocabulary reports `point`, `jsonb` and `numeric` all as
> `string`. A `point` column is therefore "the best key" per §4.2, and `GROUP BY`
> on it raises `could not identify an equality operator for type point`.
> `min(jsonb)` does not exist, while `GROUP BY` on jsonb succeeds, so the failure
> is per-type rather than per-family and no coarsening captures it. In the other
> direction a `numeric` column mapped to `string` is never offered `sum`/`avg` —
> the vocabulary forbids legal aggregates as well as permitting illegal ones.
> Probed by `apps/react-router/src/.server/groupingLegality.smoke.test.ts`, which
> creates and drops its own three-column fixture. §2.8's guard then routes the failure into
> execution, because `n_distinct` for such a column is `0`, which §2.8 maps to
> UNKNOWN and therefore to "warn and proceed".
>
> **Nor is the catalogue on its own the answer** — that was the first replacement
> for this row, and it is also wrong. `jsonb` has an equality operator, so a
> catalogue-only rule offers it as a group key, and the Table cannot render a JSON
> document as a cell value in the first place. The catalogue answers what Postgres
> _can_ do, never what is worth offering. ADR-058 therefore gates on the column's
> **analytical role** first — dimensions are grouped, facts are aggregated, and
> `jsonb`/`point`/arrays and the rest are out of both — and keeps the catalogue
> underneath as a floor for types the role table has no opinion about.

The one thing the vocabulary cannot distinguish — `integer` vs `numeric` — is
genuinely moot, because `sum`/`avg`/`count` all arrive from `pg` as **strings**
either way (the `int8`/`numeric` trap `get-rows-count.util.ts` already works
around with `Number(...)`). That part of the original reasoning survives.

### 2.3 `GROUPING SETS` is the internal primitive

The builder always emits `GROUP BY GROUPING SETS (…)`, expanding rollup to n+1
sets and cube to 2ⁿ in TypeScript, in Postgres's own canonical order (reverse
binary counting).

Justified by §1.7(b): the planner normalizes all three into the same
`MixedAggregate`, so expansion costs **nothing** at execution. What it buys:

- One emission path — simple/rollup/cube share one snapshot-test shape.
- The guard rails need the expanded list anyway to count sets and bound rows;
  emitting sugar while expanding for the guard means two representations that drift.
- The mask↔set-index mapping (§2.4) and the count-of-groups query (§2.9) are both
  defined over the expanded list.
- Expansion is a pure array function testable with **zero SQL**, so it lands in the
  DB-free coverage job.

_Rejected — emit `ROLLUP`/`CUBE` directly._ Shorter text, but three emission paths
and a guard that must re-expand regardless. The verbosity objection (cube at n=4 is
16 sets) is unreachable: §2.8 caps cube at depth 3.

### 2.4 One variadic `GROUPING(…)` mask, with a decoder that travels with it

Project a single `GROUPING(k₁, …, kₙ) AS "group_mask"`.

An earlier draft specified per-column `GROUPING(col) AS grp__<col>` flags, on the
grounds that bit positions are positional so reordering keys reinterprets them.
**That objection does not survive scrutiny**: the mask is never serialized into a
URL or persisted — it is a per-response projection, and the built query carries
`keys` and `groupingSetMasks` alongside it, so the decoder travels with the data it
decodes. The single mask is better: fixed arity regardless of depth, one alias to
defend against collision instead of n, and the mask _is_ the grouping-set identity
rather than something reassembled from flags. `GROUPING()` returns `int4`, which
`pg` parses to a real JS number.

Decoding, for key _i_ of _n_:

```text
bit = (group_mask >> (n - 1 - i)) & 1
bit === 1               → { kind: 'aggregated' }   // structural NULL → "All …"
bit === 0 && v === null → { kind: 'null' }         // real data NULL
otherwise               → { kind: 'value', value: v }
```

`groupedKeyCount = n − popcount(mask)`. **This equals tree depth only under
rollup**, where the sets form a chain; under cube, set `(b)` has count 1 but is not
on `(a)`'s path — so `groupingSetIndex` is exposed separately for general hierarchy
reconstruction.

Aliases are `group_mask`, `count_rows`, and `${fn}_${column}` — all lowercase
snake, passing `SAFE_IDENTIFIER_PATTERN`. Construction-time refusals: the fixed
aliases must not collide with real columns, and all aliases must be mutually unique
and disjoint from the group keys.

### 2.5 Fetch strategy — one flat query, all levels at once

Grounded in §1.6:

- The virtualizer windows a **flat array by index** and assumes **uniform row
  height**. A single flat result keeps `TData[]` flat; group, subtotal and
  grand-total rows are ordinary rows at the same `rowHeight`, so the
  `offsetY + n×rowHeight + bottomSpacer === totalHeight` invariant is untouched.
- Expansion becomes **pure client-side filtering of an already-materialized
  array** — no fetch, no loader, no URL growth, no resource route.
- A grouped result is _bounded_ by the guard rails, unlike the raw table that
  motivated infinite scroll. §1.7(g) shows a real depth-4 cube is 1 422 rows.

_Rejected — lazy per-level fetch on expand._ Needs a resource route per group and a
per-group cursor, and `assertKeysetCursor` requires a unique terminal sort column a
grouped result does not have. Right for unbounded hierarchies; ours are bounded.

**Consequence — infinite scroll is off while grouped** (`hasMore: false`, sentinel
disabled). Stated as behaviour, not a regression.

### 2.6 Grouping config in the URL; expansion state in the client store

A split, not a compromise.

- **Grouping config changes the SQL** ⇒ it must drive the loader ⇒ `?grouping=`,
  riding the **existing** `persistTableState` → `/_action/persist-cookie` →
  `redirect` flow with `searchParamKey: 'grouping'`. No new mechanism, and
  `MAX_COOKIE_ENTRY_VALUE_LENGTH` already guards the ceiling (~120 chars at depth 2).
- **Expansion changes nothing server-side** ⇒ it must **not** be in the URL. There
  it would fire a navigation and full loader revalidation per expand/collapse, and
  the ceiling is real at cube depth 3.

_Rejected — expansion in the URL + `shouldRevalidate`._ The existing
`shouldRevalidatePersistCookieAction` keys off `actionStatus === 204`; an expansion
change _does_ change a param, so the action would `redirect` and
`defaultShouldRevalidate` would honour it. Making it work needs a second,
param-diffing `shouldRevalidate` — new machinery to undo an avoidable problem.

**The cost, stated plainly:** expansion resets on revalidation. Mitigated, not
hidden — expansion is keyed by **group path** (a stable value tuple), so it is
re-applied by path after refetch and survives sort changes entirely (sorting
reorders rows without changing paths). Paths that no longer exist drop silently.

**Shareable URLs:** a grouped view _is_ linkable and restorable — grouping, sort
and filters all live in the URL. Expansion does not travel; the recipient sees the
default expansion level. The shared thing is the analysis, not the scroll position.

**Streaming:** unchanged. The loader keeps returning an unawaited `dataPromise`
consumed by `use()`; a slow grouped query shows `TableSkeleton`. Do **not**
introduce `<Await>`/`defer`.

> **Correction — the mechanism this paragraph originally proposed to extend does
> not exist.** The original text read: _"The remount `key` in
> `createTableRouteLoader` gains the grouping param so a grouping change remounts
> the boundary like a sort change."_ That `key` is produced at
> [`createTableRouteLoader.util.ts:147`](../../../packages/ui/src/routing/loaders/createTableRouteLoader.util.ts)
> and **read by nothing** — `useTableRoutePage`, `TableRouteView` and every app
> route component destructure a fixed set that excludes it, and no JSX `key` is
> written from it. The probe that could have disproved this is enumerating every
> consumer of table loader data across `packages/ui/src` and
> `apps/react-router/src`; the competing explanation, React Router applying the
> field itself, fails because it does not read a loader field named `key` and a
> JSX key must be written explicitly. Remounting works today only because
> `use(dataPromise)` re-suspends on a new promise reference, which a grouping
> change produces for free. The field is separately defective — it concatenates
> two params with no delimiter, so distinct states collide. It is wired or deleted
> by issue #557 before grouping depends on it either way.

### 2.7 Row identity and capability interaction

Group rows get a **path key** `g:<depth>:<v1>|<v2>`, values `encodeURIComponent`-escaped
like `resolveCrudRowId`. Leaf rows keep `resolveCrudRowId`. This forces replacing
`key={rowIndex}` — which **Slice 0 does anyway**, so grouping inherits it.

| Case                   | Behaviour                                                                                                                                       | Why                                                                                                      |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Grouped **and hidden** | Allowed; the group header still renders the key                                                                                                 | A group header row is not a projection of the visible column set — it spans width like `TableEmptyState` |
| Grouped **and pinned** | Group header + grand-total rows span full width (`colSpan`), so pinning does not apply. Subtotal rows are per-column and **do** respect pinning | Pinning is horizontal, grouping vertical; only per-column rows have a horizontal structure to pin        |
| Column **reordering**  | Group key order is independent of column order                                                                                                  | Group order is analytic intent, not layout                                                               |
| Grouped **and static** | `isGroupable` defaults `false` when `isStatic`                                                                                                  | Consistent with how `isStatic` gates pinning/hiding today                                                |
| **Sorting**            | Composes per §4.4                                                                                                                               |                                                                                                          |

### 2.8 Guard rails

**Depth: max 4 keys, cube capped at 3.** Not two unrelated rules — the cap falls
out of the bound. `CUBE(4)` bounds at `∏(dₖ+1)`, which reaches 194 481 at only 20
distinct per column, past the hard refuse; and it is 16 grouping sets and several
planner chains. `ROLLUP(4)` is 5 sets, one chain, roughly one sort. 4 is also the
legibility limit for an indented tree. Depth is checked **before any DB round
trip** (it is pure), so a bad request never costs a catalog query.

**Column eligibility** (all must hold): in `allowedColumns`; `isGroupable !== false`;
`dataType` ∈ {`string`, `boolean`} or a low-cardinality `number` (§4.2 — `currency`
and raw `date` are excluded; date grouping needs `date_trunc`, a v2 expression key);
`resolvedDistinct ≤ 1 000`; and **not unique-ish** (`n_distinct = -1`, or
`resolvedDistinct ≈ reltuples`) — refused with a specific message, because grouping
by `order_id` is the likeliest mistake (§1.7(g)).

**Pre-flight estimation** — one catalog query, all keys at once, where schema,
table and the key array are all **bound params**, so it has zero
identifier-interpolation surface:

```sql
SELECT s.attname, s.n_distinct, c.reltuples
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  LEFT JOIN pg_stats s ON s.schemaname = n.nspname
                      AND s.tablename  = c.relname
                      AND s.inherited  = false
                      AND s.attname    = ANY($3::text[])
 WHERE n.nspname = $1 AND c.relname = $2
```

`s.inherited = false` avoids double rows on a partition parent; `pg_stats` is
permission-filtered, so an invisible column falls into UNKNOWN naturally.

```text
resolvedDistinct = missing row                   → UNKNOWN
                 | n_distinct = 0                → NOT GROUPABLE (see correction)
                 | n_distinct > 0                → n_distinct
                 | n_distinct < 0                → ceil(-n_distinct * max(reltuples, 0))
reltuples <= 0                                   → UNKNOWN
bounds: flat ∏dₖ · rollup 1 + Σᵢ ∏_{j≤i} dⱼ · cube ∏(dₖ+1)
```

> **Correction — `n_distinct = 0` originally mapped to UNKNOWN here, and that is
> the branch that turns this guard from a safety valve into a trap.** UNKNOWN
> means "warn and proceed", so a column Postgres cannot group at all would be
> waved through to fail at execution. The obvious reading of `0` is "never
> `ANALYZE`d" — but §1.7(e) already established that a never-analyzed table has
> **no `pg_stats` row at all**, and the discriminating probe closes it: run
> `ANALYZE` on the fixture and re-read `pg_stats`; the row for the `point` column
> exists and `n_distinct` stays `0`, while the `jsonb` and `numeric` columns
> report their real counts — and the `point` column holds 35 genuinely distinct
> values, so `0` is not "too few to matter" either. `0` is Postgres saying the
> type has no equality operator, so
> distinctness is undefined — such a column is not groupable, and the catalogue
> check of §2.10(4) refuses it by type before this estimator is ever consulted.

**Thresholds** — anchored to the render path. §1.7(g) shows realistic groupings of
a 500k-row table land near 1 400 rows, so these guard the pathological case, not
normal use:

- **WARN at 5 000** — ~1 MB of payload, past what a person reads, still recoverable.
- **HARD REFUSE at 50 000** — ~10 MB through the SSR payload.
- **UNKNOWN statistics ⇒ warn and proceed, never refuse.** Refusing would make the
  feature dead on a freshly restored database. Instead run with a hard `LIMIT` at
  WARN+1: a full result is discarded and returns the same "too large" refusal. One
  mechanism doing two jobs — stats fallback _and_ general safety belt. Emit a
  `stats_unavailable` warning so the operator learns to ANALYZE.

_Rejected — costed `EXPLAIN` as the primary guard._ Its estimate for a
grouping-sets node derives from the same `pg_stats` we already read — an extra
round trip for no new information when stats exist, equally blind when they do not.
Never `EXPLAIN ANALYZE`; it executes. Keep `EXPLAIN` as a diagnostic behind a flag.

**Timeout policy.** The pool sets `statement_timeout` per-connection (30 s default)
and `runQuery` has no override, so one must be built.

- ✗ `SET statement_timeout` without `LOCAL` — persists on the pooled connection and
  silently re-tunes every later query on it. The classic pooling bug.
- ✗ `SET LOCAL statement_timeout = $1` — **a syntax error**, §1.7(f).
- ✓ **`SELECT set_config('statement_timeout', $1, true)` inside `withTransaction`** —
  fully parameterised, transaction-scoped, and §1.7(f) proves it reverts on COMMIT.

**10 000 ms**, from a new `DB_GROUP_STATEMENT_TIMEOUT_MS` in `env.schema.ts`.
Deliberately shorter than the pool-wide 30 s: a grouped read sits behind a loader,
30 s exceeds any browser-side patience, and failing at 10 s leaves headroom for the
loader to render an error rather than the request itself timing out.

A timeout raises SQLSTATE **57014**. Add `QueryCanceledError extends PersistenceError`
branched in `mapDbError` before the fallback, using the existing structural
`hasPostgresErrorCode` narrowing — so one `instanceof PersistenceError` still
catches everything (ADR-050). **Name it for the SQLSTATE, not the cause**: 57014 is
also raised by `pg_cancel_backend`. At the loader edge, map to a plain discriminated
union — `{ kind: 'grouping_too_expensive' }` beside
`{ kind: 'grouping_refused'; reason; estimate }` — since classes do not survive
single fetch.

### 2.9 Pagination

`LIMIT`/`OFFSET` over a grouping-set result is coherent but slices mid-tree, so a
subtotal can land on the next page from its children. **Keyset is structurally
unavailable**, and the repo's own guard proves it: `assert-keyset-cursor.util.ts`
requires a non-null unique terminal sort column, and (a) only `(group_mask, k₁…kₙ)`
is unique — key tuples repeat across sets — and (b) the innermost key is NULL on
_every subtotal row by construction_, precisely where pages end.

**Decision: grouped reads are unpaginated, bounded by the guard rails instead**,
with the `LIMIT` backstop above. _v2, named not built:_ paginate **by top-level
group** (first query for the top-N key values, then `WHERE k₁ IN (…)`) — the only
form that keeps every subtotal with its parent.

**Count of groups** needs a subquery, which `query-builder/ARCHITECTURE.md` forbids
but this module permits. Inner projection is `SELECT 1`, not the keys — forming the
groups is unavoidable but skipping aggregate transitions is real savings. It costs
roughly the data query, so it is **opt-in and default off** (mirroring
`includeTotal`); when the guard already produced an estimate under WARN, that
estimate is the displayed total.

### 2.10 What needs an ADR

1. **Aggregation is builder-generated, not view-defined** — qualifies
   `query-builder/ARCHITECTURE.md` and CQMS's `PRD.md`. Must state why Mode 2
   makes views impossible (runtime-chosen keys) and why a _sibling_ module
   preserves the flat builder's non-goals. Fold in the grouping-set primitive with
   the identical-plan evidence. → adopted as
   [ADR-059](../../decisions/ADR-059-aggregation-is-builder-generated.md).
2. **Grouping config is URL state; expansion is client state** — §2.6 and its cost.
3. **The grid focus model** (`role="grid"` + roving tabindex) — ADR-011's deferred
   "Step 0", load-bearing for row selection and nested headers too, so it deserves
   its own number rather than arriving inside grouping.
4. **Group-key and aggregate legality comes from the Postgres catalogue**, not from
   `TableColumnDataType` — added after the review falsified §2.2's premise (see the
   correction there). → adopted as
   [ADR-058](../../decisions/ADR-058-grouping-legality-by-analytical-role.md).
   **It supersedes §3.6's `columnTypes` field and §4.2's per-`dataType` table**:
   the builder is handed the resolved capability map rather than re-deriving
   legality from a vocabulary that maps `point` and `jsonb` onto `string`.
5. **A table capability is declared once, on the loader `meta`** — added after the
   review found two live mechanisms for the same decision: ADR-056 declares
   endpoint capabilities as view props defaulting off, while `crud` is declared on
   the loader `meta`. Grouping would have entrenched the split.

> **Correction — all five go in `docs/decisions/`.** The original text sent
> (2)–(3) to `apps/react-router/docs/decisions/` "alongside ADR-011". ADR-048's
> test is whether a decision leaves when CQMS moves out; both candidate homes
> stay, so the tie-break is package-versus-app — and every line of grouping code
> lives in `packages/ui` and `packages/server`. ADR-011 and ADR-012 sit in the app
> home because they predate the Table's extraction into the package; they are
> grandfathered, not precedent.

Number with `vp run adr:verify` (global sequence) — all five in `docs/decisions/`;
register with `--write`. Drafts belong in [`adr-drafts/`](./adr-drafts/), by slug
with no number: `adr-registry.mjs` hard-fails a numbered draft, and a reserved
number goes stale as the sequence moves. Also required: a
**changeset** for `@lcabrera/ui` and `@lcabrera/server` (`api-surface:verify` gates
the public type surface), and new subpaths in **both** `exports` and
`publishConfig.exports` in `packages/server/package.json`
(`verify-publish-surface.mjs` gates the pair).

---

## 3. Public API

Types only. `type` never `interface`, all `readonly`, `Args` suffix, no explicit
return types, domain-folder file naming.

### 3.1 The `crud`-style opt-in flag

Mirrors `TableCrudConfig`, set from the loader `meta` exactly as `crud: CRUD` is today:

```ts
export type TableGroupingConfig = {
  readonly enabled?: boolean;
  readonly maxDepth?: number;                   // default 4, cube capped at 3
  readonly modes?: readonly GroupingMode[];     // default all three
  /** Mode 1: a curated default the user may still change unless locked. */
  readonly defaultGrouping?: GroupingState;
  readonly isLocked?: boolean;                  // Mode 1 preset-only
};
// on TableMetaState, beside `crud`:
readonly grouping?: TableGroupingConfig;
```

`TableColumn<TData>` gains exactly one field — `readonly isGroupable?: boolean` —
defaulting from `dataType` per §4.2 and `false` when `isStatic`. Same shape as
`isFilterable`/`isSortable`.

### 3.2 Grouping commands — reuses `CommandDescriptor` unchanged

```ts
export const GROUP_BY_COLUMN_COMMAND = {
  icon: GroupIcon,
  id: 'column.group.add' as CommandId,
  label: 'Group By',
} satisfies CommandDescriptor;
export const CLEAR_GROUPING_COMMAND = {
  icon: GroupOffIcon,
  id: 'column.group.clear' as CommandId,
  label: 'Clear Grouping',
} satisfies CommandDescriptor;
export const AGGREGATION_SIMPLE_COMMAND = {
  icon: GroupFlatIcon,
  id: 'table.group.simple' as CommandId,
  label: 'Simple',
} satisfies CommandDescriptor;
export const AGGREGATION_ROLLUP_COMMAND = {
  icon: GroupRollupIcon,
  id: 'table.group.rollup' as CommandId,
  label: 'Rollup',
} satisfies CommandDescriptor;
export const AGGREGATION_CUBE_COMMAND = {
  icon: GroupCubeIcon,
  id: 'table.group.cube' as CommandId,
  label: 'Cube',
} satisfies CommandDescriptor;
```

The aggregation trio is a textbook `deriveToggleCommandState` fit
(`TValue = GroupingMode`). Per-column group-by is the toggle that finally feeds
`isDisabled`:

```ts
deriveToggleCommandState({
  current: groupedLevelLabel, // '1' | '2' | undefined
  isDisabled: !isColumnGroupable, // <- the seam nothing currently feeds
  target: nextLevelLabel,
});
```

### 3.3 Icons — five new bundles

Following the existing pattern exactly: one folder per icon
(`<Name>Icon/<Name>Icon.component.tsx` + `index.ts`), matching the **16×16
stroke-1.5 family** that `FilterIcon` belongs to, since these sit beside it in the
header menu. `aria-hidden='true'`, `fill='none'`, `stroke='currentColor'`,
`strokeLinecap`/`strokeLinejoin='round'`, `size = 16` default, `{...props}` spread last.

`GroupIcon` is the primary glyph — a full-width header bar over two indented child
bars, which reads as "grouped rows" at 16 px:

```tsx
export const GroupIcon = ({ size = 16, ...props }: IconProps) => (
  <svg
    aria-hidden='true'
    fill='none'
    height={size}
    viewBox='0 0 16 16'
    width={size}
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M2 3.5H14M6 8H14M6 12.5H14'
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='1.5'
    />
  </svg>
);
```

`GroupOffIcon` adds the diagonal `M2.5 13.5L13.5 2.5` (the `EyeOffIcon`
convention). The mode trio distinguishes on structure alone: `GroupFlatIcon` three
equal bars, `GroupRollupIcon` a staircase indent, `GroupCubeIcon` a cube outline.
Add each to `Icons/ARCHITECTURE.md` and the `Icons.test.tsx` render sweep.

### 3.4 Grouping state and row model (`@lcabrera/ui`)

```ts
export type GroupingMode = 'cube' | 'rollup' | 'simple';
export type AggregateFn =
  | 'avg'
  | 'boolAnd'
  | 'boolOr'
  | 'count'
  | 'countDistinct'
  | 'max'
  | 'min'
  | 'sum';

export type ColumnAggregation<TData = Record<string, unknown>> = {
  readonly columnKey: DataKey<TData>;
  readonly fn: AggregateFn;
  /** Optional FILTER (WHERE …), reusing the existing ColumnFilter shape. */
  readonly filter?: ColumnFilter;
};

export type GroupingState<TData = Record<string, unknown>> = {
  readonly aggregations: readonly ColumnAggregation<TData>[];
  /** Group-by keys, outermost first. Empty ⇒ grouping off. Max 4 (3 for cube). */
  readonly keys: readonly DataKey<TData>[];
  readonly mode: GroupingMode;
};

export type GroupCell =
  | { readonly kind: 'aggregated' } // structural NULL → "All …"
  | { readonly kind: 'null' } // real data NULL
  | { readonly kind: 'value'; readonly value: unknown };

export type GroupRowKind = 'grand-total' | 'group-header' | 'leaf' | 'subtotal';

export type GroupedRow<TData> = {
  readonly aggregates: Readonly<Record<string, string | null>>; // see §4.2 on strings
  readonly depth: number;
  readonly groupingSetIndex: number; // hierarchy under cube (§2.4)
  readonly keyValues: Readonly<Record<string, GroupCell>>;
  readonly kind: GroupRowKind;
  readonly path: string; // `g:<depth>:<v1>|<v2>`
  readonly row: TData;
};
```

### 3.5 Search-param serialization

`?grouping=` — compact JSON in the `?sorting=` house style:

```ts
export type CompactGrouping = {
  readonly a: Readonly<Record<string, readonly string[]>>; // columnKey -> [fn, …]
  readonly k: readonly string[]; // keys, outermost first
  readonly m: 'c' | 'r' | 's'; // cube | rollup | simple
};
// {"m":"r","k":["order_status","shipping_country"],"a":{"total_amount":["sum"],"*":["count"]}}
```

New utils mirroring the existing pair: `serializeGroupingToURL.util.ts` /
`deserializeGroupingFromURL.util.ts`, plus `sanitizeGroupingByColumns.util.ts`
alongside `sanitizeFiltersByColumns` — dropping keys absent from `columns` or with
`isGroupable === false`, so a hand-edited URL degrades rather than throws.

### 3.6 Query-builder input/output (`@lcabrera/server`)

```ts
export type GroupAggregate = {
  /** Required when `filters` is present; else derived `${fn}_${column}`. */
  readonly alias?: string;
  /** Omitted only for `count` → `count(*)` aliased `count_rows`. */
  readonly column?: string;
  readonly filters?: readonly QueryFilter[]; // → FILTER (WHERE …)
  readonly fn: AggregateFn;
};

export type GroupSort =
  | { readonly aggregateAlias: string; readonly direction: 'asc' | 'desc' }
  | { readonly direction: 'asc' | 'desc'; readonly key: string };

export type GroupQueryDescriptor = {
  readonly aggregates: readonly GroupAggregate[];
  /** REQUIRED here — unlike SelectQueryDescriptor, where it is opt-in. */
  readonly allowedColumns: readonly string[];
  /** Derived from the route's COLUMNS — never a second hand-written catalog (§2.2). */
  readonly columnTypes: Readonly<Record<string, TableColumnDataType>>;
  readonly filters?: readonly QueryFilter[];
  readonly grouping: 'cube' | 'flat' | 'rollup';
  readonly keys: readonly string[]; // ordered, ≤4 (≤3 for cube)
  /** Safety belt, not a page — a full result is refused (§2.8). */
  readonly maxRows: number;
  readonly schema: string;
  readonly sort?: readonly GroupSort[];
  readonly subtotalPlacement?: 'first' | 'last';
  readonly table: string;
};

export type BuiltGroupQuery = {
  readonly aggregates: readonly {
    readonly alias: string;
    readonly fn: AggregateFn;
    readonly outputType: 'boolean' | 'date' | 'numericString' | 'text';
  }[];
  readonly groupingSetMasks: readonly number[]; // index i ↔ expanded set i
  readonly keys: readonly string[]; // ordered; bit (n-1-i) ↔ keys[i]
  readonly maskAlias: 'group_mask';
  readonly text: string;
  readonly values: readonly unknown[];
};
```

`allowedColumns` is **required**, not optional. Every group key is by definition
request-derived, so `SelectQueryDescriptor`'s opt-in semantics would be a silent
hole; the type makes omitting it impossible.

**ADR-039 duplication:** `GroupingState`/`AggregateFn` are declared independently in
both packages, held in step by a new `groupingContract.test.ts` copying
`filterContract.test.ts` **including its `: Record<string, T>` annotation**.

---

## 4. Query generation

### 4.1 Structure

A new `group-query-builder` module, created as a sibling of
`packages/server/src/db/query-builder/` — **pure, never imports `getPool`**,
so its whole suite runs DB-free. One export per file + colocated test, matching the
sibling's granularity:

`group-query-builder.types.ts` · `ARCHITECTURE.md` · `expand-grouping-sets.util.ts` ·
`assert-group-keys.util.ts` · `assert-group-aggregates.util.ts` ·
`group-query-builder.constants.ts` · `resolve-aggregate-output-type.util.ts` ·
`build-aggregate-projection.util.ts` · `build-grouping-sets-clause.util.ts` ·
`build-group-order-by-clause.util.ts` · **`build-group-query.util.ts`** ·
**`build-group-count-query.util.ts`** · `build-group-stats-query.util.ts` ·
`estimate-group-cardinality.util.ts` · `assert-group-cardinality.util.ts`

Impure sibling one level up: `db/select-grouped-rows.util.ts` — `withTransaction` →
`set_config` → stats + guard → data (+ optional count).

Assembly: `SELECT` → `FROM` → `WHERE` → `GROUP BY GROUPING SETS` → `ORDER BY` →
`LIMIT`, param numbering threaded through the same immutable `ClauseAccumulator`.

### 4.2 Aggregate selection, derived from `dataType`

The **`dataType` sets the ceiling**, the **user picks from it**, and nothing is
inferred at runtime. A pure `defaultAggregatesForDataType` seeds the menu, and a
unit test asserts every requested `{column, fn}` is type-legal — inference as a
lint, not as behaviour.

| `dataType` | Groupable?                                      | Aggregates                                           | Notes                                                                                                                                 |
| ---------- | ----------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `string`   | **yes** — the best key                          | `count`, `countDistinct`, `min`, `max`               | min/max is collation-ordered                                                                                                          |
| `boolean`  | **yes** (≤3 groups incl. NULL)                  | `count`, `countDistinct`, `boolAnd`, `boolOr`        | **no `min`/`max`** — Postgres has no boolean min/max aggregate                                                                        |
| `number`   | yes **only if low-cardinality** (guard decides) | `count`, `countDistinct`, `sum`, `avg`, `min`, `max` |                                                                                                                                       |
| `currency` | **no** — continuous                             | `count`, `countDistinct`, `sum`, `avg`, `min`, `max` | a measure, not a key                                                                                                                  |
| `date`     | **no** raw — near-unique                        | `count`, `countDistinct`, `min`, `max`               | **no `avg`** — Postgres defines it only for numeric families and `interval`. Date grouping needs `date_trunc(…)`, a v2 expression key |

`count(*)` is always available regardless of type, keyed `'*'` → alias `count_rows`.

**Output types.** `count` (int8), `sum` and `avg` all arrive from `pg` as
**strings**. `outputType: 'numericString'` is the honest name, computed at build
time and shipped on `BuiltGroupQuery.aggregates`, so the UI formatter never has to
guess whether it must parse.

**The `Record<AggregateFn, …>` map**, modelled on `OPERATOR_SQL` — same closed
exhaustive shape, so a new variant is a type error, but the value is a spec because
`countDistinct → { distinct: true, sql: 'count' }` cannot be a bare string:

```ts
type AggregateSpec = { readonly distinct: boolean; readonly sql: string };
const AGGREGATE_SQL: Record<AggregateFn, AggregateSpec> = {/* … */};
```

**`FILTER (WHERE …)`** reuses `QueryFilter[]` and `appendFilterClause` verbatim —
zero new filter code, one unbroken `$n` run. **Consequence: the SELECT list is
emitted before WHERE, so FILTER params consume `$1..$k` and WHERE starts at
`$k+1`** — a departure from every existing builder, where WHERE owns `$1`.
`buildWhereClause` already accepts `startParamIndex`; it just has to be used. §4.5(d).

**`COUNT(DISTINCT …)`** uses a per-group tuplesort, redone for every grouping set.
**At most one per query**, refused at construction time above that, and its presence
flips the guard to its stricter thresholds.

### 4.3 Ordering

Per key _i_, in descriptor order:

```text
GROUPING("key_i") <placement-dir>, "key_i" <user-dir>
```

`<placement-dir>` is `ASC` for `subtotalPlacement: 'last'` (default) and `DESC` for
`'first'`. **A `GROUPING` term is emitted only if that key is absent from at least
one grouping set** — one uniform rule that degenerates correctly: with a single flat
set no key is ever absent, so the ORDER BY is byte-identical to
`buildOrderByClause`'s output.

**Why no `NULLS` keyword is needed** (§1.7(c), proven): partition by `GROUPING(x)`.
Where it is `1`, x is NULL on _every_ row in the partition, so the second key is
constant and orders nothing — placement is not merely unspecified, it is
irrelevant. Where it is `0`, x is real data and any genuine NULL takes Postgres's
default placement, exactly as the flat list view gives it. The two null kinds are
**never adjacent**, because the leading `GROUPING` term separates them into disjoint
partitions; and `GROUPING()` is `integer`, never NULL, so the leading key never
invokes placement at all. This leaves `build-keyset-comparison.util.ts`'s dependence
on default placement untouched. ∎

### 4.4 How user sorts compose

- **On a group key** — the user's direction applies to the **value** term only; the
  `GROUPING` term keeps its placement direction, so a subtotal stays a footer under
  a DESC key. This decoupling is why `buildOrderByClause` cannot be reused.
- **On an aggregate, innermost level** — supported. §1.7(d) proves
  `… GROUPING(k₂), <alias> DESC` sorts leaves within each parent while keeping the
  tree intact.
- **On an aggregate, ranking ancestors** — **refused at construction time.**
  §1.7(d) also shows that hoisting the aggregate above an ancestor key scrambles the
  hierarchy, and ranking parents by _their own_ totals needs the parent's aggregate
  on the child row (`sum(…) OVER (PARTITION BY k₁)`) — past a v1 that has only just
  admitted subqueries. The builder enforces the confinement structurally rather than
  trusting callers, in the style of `assertKeysetCursor`. Window-function ranking is
  a named v2.

### 4.5 Worked examples

`public.enterprise_orders`, keys `order_status` + `shipping_country`, aggregates
`count(*)` and `sum(total_amount)`, filters
`[{order_date, gte, '2026-01-01'}, {is_gift, eq, false}]`, `maxRows: 5001`.
Real columns, verified against the live schema.

**(a) Simple** — 1 set ⇒ **no `GROUPING` terms** in ORDER BY (emission rule):

```sql
SELECT "order_status", "shipping_country",
       GROUPING("order_status", "shipping_country") AS "group_mask",
       count(*) AS "count_rows", sum("total_amount") AS "sum_total_amount"
FROM "public"."enterprise_orders"
WHERE "order_date" >= $1 AND "is_gift" = $2
GROUP BY GROUPING SETS (("order_status", "shipping_country"))
ORDER BY "order_status" ASC, "shipping_country" ASC
LIMIT $3
```

`values: ['2026-01-01', false, 5001]` · `groupingSetMasks: [0]`

**(b) Rollup** — sets `(a,b)`, `(a)`, `()` ⇒ masks `0, 1, 3`:

```sql
SELECT "order_status", "shipping_country",
       GROUPING("order_status", "shipping_country") AS "group_mask",
       count(*) AS "count_rows", sum("total_amount") AS "sum_total_amount"
FROM "public"."enterprise_orders"
WHERE "order_date" >= $1 AND "is_gift" = $2
GROUP BY GROUPING SETS (("order_status", "shipping_country"), ("order_status"), ())
ORDER BY GROUPING("order_status") ASC, "order_status" ASC,
         GROUPING("shipping_country") ASC, "shipping_country" ASC
LIMIT $3
```

`values: ['2026-01-01', false, 5001]` · `groupingSetMasks: [0, 1, 3]`

Mask 2 (`(shipping_country)` alone) never occurs — that is what makes it a rollup.

**(c) Cube** — sets `(a,b)`, `(a)`, `(b)`, `()` ⇒ masks `0, 1, 2, 3`:

```sql
GROUP BY GROUPING SETS (("order_status", "shipping_country"), ("order_status"), ("shipping_country"), ())
ORDER BY GROUPING("order_status") ASC, "order_status" ASC,
         GROUPING("shipping_country") ASC, "shipping_country" ASC
```

**The ORDER BY is identical to (b)** — the payoff of the GROUPING-led sort: it
flattens any grouping-set family into one well-defined order. Trace: partition
`GROUPING(order_status)=0` (masks 0,1) forms per-status blocks with details before
each subtotal; partition `=1` (masks 2,3) has `order_status` constant-NULL, so the
next key puts the country-only rows before the grand total, which lands last.

**(d) FILTER param shift** — adding
`count(*) FILTER (WHERE "priority" = 'Urgent') AS "count_rows_urgent"` to (a):

```sql
SELECT …, count(*) FILTER (WHERE "priority" = $1) AS "count_rows_urgent", …
FROM "public"."enterprise_orders"
WHERE "order_date" >= $2 AND "is_gift" = $3
… LIMIT $4
```

`values: ['Urgent', '2026-01-01', false, 5001]` — **WHERE now starts at `$2`.**

### 4.6 WHERE vs HAVING

**Every existing filter goes in WHERE**, unchanged and reusing `buildWhereClause`
verbatim. No `ColumnFilter` variant can express an aggregate predicate — each
targets a single base column — so all are legal pre-aggregation. Zero new filter code.

Two traps to **document rather than fix**:

1. A WHERE filter on a column that is also a group key changes what subtotals
   _mean_: filter `order_status IN ('Shipped')` and roll up over it, and the row
   labelled "All" is really "All Shipped". Correct SQL, misleading label — so the
   "All …" cell **must** render with an active-filter indicator, or the grand total
   lies by omission. This is a UI obligation, not a SQL one.
2. `neq` is `col <> $1`, false for NULL, so it silently drops NULL rows. Already
   true in the flat view — but under grouping it moves an _aggregate_, not just a
   row count. Existing contract; changing it would break the flat view.

**`HAVING` is an explicit non-goal for v1** (§7).

---

## 5. Loader integration

```text
User toggles group-by (header menu or drawer)
  └─ useSetColumnGrouping            (mirrors useSetColumnSorting)
       └─ resolveColumnGroupingUpdate (pure; mirrors resolveColumnSortingUpdate)
            └─ { searchParamKey: 'grouping', searchParamValue: serializeGroupingToURL(state) }
       └─ persistTableState → useFetcher POST /_action/persist-cookie
            └─ applySearchParamUpdates → changed ? redirect(url) : 204
                 └─ redirect ⇒ navigation ⇒ loader re-runs
                      └─ readTableLoaderStateFromRequest
                           ├─ deserializeGroupingFromURL(?grouping)
                           └─ sanitizeGroupingByColumns({ columns, grouping })
                      └─ createTableRouteLoader
                           ├─ grouping.keys.length > 0 ? fetchGroupedPage : fetchPage
                           ├─ (no remount key — see §2.6; #557 decides its fate)
                           └─ dataPromise (unawaited — streaming unchanged)
                                └─ Suspense → use() → TableDataProvider
                                     └─ mapGroupedRows (group_mask → GroupedRow[])
```

**Server side**, in each route's `.server/`:

1. `assertGroupKeys` — depth, eligibility, uniqueness (pure ⇒ 400, never SQL).
2. `estimateGroupCardinality` — the §2.8 catalog query. Refuse ⇒ typed error; warn ⇒
   a flag on the response.
3. `buildGroupQuery` → inside `withTransaction`: `set_config` → data (+ optional count).
4. Errors through `mapDbError`, then a **plain discriminated union** at the loader
   edge (ADR-050 — classes do not survive single fetch).

**Revalidation: unchanged.** `shouldRevalidatePersistCookieAction` stays exactly
as-is; grouping config changes a param so the action redirects and
`defaultShouldRevalidate` correctly re-runs the loader, while expansion never
touches the URL and so never revalidates. **No new `shouldRevalidate` logic is
needed** — the payoff of the §2.6 split.

---

## 6. Phased delivery

### Slice 0 — Grid focus model + stable row identity _(prerequisite, ships alone)_

`role="grid"`/`row`/`gridcell`, roving tabindex, arrow/Home/End/PageUp/PageDown, and
`key={rowIndex}` replaced with a data-derived key. **Flat grid, no grouping.** Ships
value alone: the grid becomes keyboard-navigable and screen-reader correct for the
first time, and compensates for the `display` overrides in §1.6. ADR (3).

### Slice 1 — Walking skeleton _(validates the architecture end to end)_

**One route** (`enterprise-orders`), **one group key**, **flat GROUP BY**, aggregates
fixed to `count(*)` + `sum(total_amount)`, **no expansion**, **no guard**.
Header-menu toggle + the `GroupIcon`/`GroupOffIcon` bundles. Proves in one PR:
`grouping` meta flag → `dataType`-derived eligibility → allowlist → `buildGroupQuery`
→ loader → `?grouping=` round-trip → store slice → group-row rendering. ADR (1).
**Deferred here:** rollup/cube, multi-key, aggregate picker, expansion, drawer, guard.

### Slice 2 — Multi-key + aggregate selection + drawer surface

Depth to 4, the §4.2 menus, `FILTER (WHERE …)`, and a `GroupingSection` following the
`SidePanelSection` pattern with the dual-variant toolbar. Aggregation-mode trio wired
through `deriveToggleCommandState` (+ the three mode icons).

### Slice 3 — Rollup + subtotal disambiguation + ordering

`group_mask` projection, `GroupCell` mapping ("All …" vs real null **with the
§4.6(1) active-filter indicator**), subtotal and grand-total rendering, the §4.3
ordering and the §4.4 sort-composition rules.

### Slice 4 — Expansion + `treegrid`

Path-keyed client expansion, `role="grid"` → `role="treegrid"`,
`aria-level`/`aria-expanded`/`aria-posinset`/`aria-setsize`, Right/Left/`*` keys, and
focus recovery when a focused row's ancestor collapses. ADR (2).

### Slice 5 — Guard rails + timeout policy

`estimateGroupCardinality`, warn/refuse thresholds, `set_config`-based per-query
timeout, `QueryCanceledError`, and the warn / refuse / timeout UI surfaces.
**Lands before cube**, because cube is what makes it necessary.

### Slice 6 — Cube

2ⁿ expansion at depth ≤ 3, gated behind Slice 5.

### Slice 7 — Roll out to every table route

`car-sales` and `car-sales-infinite` add `grouping: { enabled: true }` to their
loader `meta`.

> **Correction — `wide-alltypes-150` is not a rollout target.** It is a rendering
> playground for very wide grids (150 columns x 1M rows), not a domain schema, so
> shipping a data feature into it would be fitting the feature to a test harness.
> It is excluded from this slice. Its type variety was only ever wanted as
> _evidence_ for §2.2, and that evidence now comes from a fixture the probe owns
> and drops (`apps/react-router/src/.server/groupingLegality.smoke.test.ts`), so
> nothing is lost by leaving the playground alone.
>
> Note also that these two routes fetch over HTTP from the api-server rather than
> reading Postgres in process, so this slice is **not** configuration-only for
> them either — it needs a grouped endpoint in `api-shared`, an Express route, a
> Fastify plugin and new fetchers. Sized accordingly, and deliberately deferred.

### Slice 8 — Mode 1 presets + totals placement setting

`defaultGrouping` / `isLocked`, plus subtotal & grand-total placement as a
user-configurable option in `GeneralSettingsSection`, persisted through
`PersistedUiState` in the `-uiFlags` cookie like the other display settings. Both are
small by construction.

**Explicitly deferred beyond v1:** `HAVING`; per-group lazy fetch; grouped-view
pagination (the top-N-group v2 shape in §2.9); window-function ancestor ranking;
`date_trunc` expression keys; custom grouping sets; client-side grouping.

---

## 7. Non-goals

| Non-goal                                                | Rationale                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`HAVING`**                                            | Nothing upstream produces it — `ColumnFilter` has no aggregate-predicate variant, so it needs new shapes in **both** packages plus a `filterContract` row. It also _fights_ the guard: HAVING reduces rows returned but not work done, so a user "fixing" a refused query with one sees it refused again. And under grouping sets it applies per-set, dropping subtotals while leaving orphaned details — a hierarchy with holes. Params would number after WHERE, before LIMIT; the accumulator already supports it |
| **Pagination of grouped results**                       | §2.9 — slicing a hierarchy orphans subtotals, and keyset is structurally unavailable (no unique column; the innermost key is NULL on every subtotal row)                                                                                                                                                                                                                                                                                                                                                             |
| **Lazy per-level fetch**                                | §2.5 — fights the fixed-height virtualizer and `assertKeysetCursor` for no gain over a bounded result                                                                                                                                                                                                                                                                                                                                                                                                                |
| **`information_schema` introspection**                  | §2.2 shows it is not needed: `dataType` + `allowedColumns` + runtime `pg_stats` already answer every question generically                                                                                                                                                                                                                                                                                                                                                                                            |
| **Client-side grouping**                                | Mode 2's premise is that the database groups; a client path needs a second aggregation engine with different NULL and collation semantics                                                                                                                                                                                                                                                                                                                                                                            |
| **Dialect abstraction**                                 | Single dialect by constraint                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **The ADR-011 command registry**                        | Still deferred. Grouping adds a sibling `*Commands.ts` and reuses the shared shape unchanged, which is the ADR's stated bar — it is not the promotion trigger                                                                                                                                                                                                                                                                                                                                                        |
| **Raw `date`/`timestamp` and `currency` as group keys** | Near-unique / continuous. Date grouping needs `date_trunc(…)`, an expression key — v2                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Grouping + infinite scroll together**                 | §2.5 — `hasMore: false` while grouped, stated as behaviour                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

---

## 8. Test plan

**SQL builder — snapshot tests.** Exact `{ text, values }` for: flat/rollup/cube at
depth 1–4; every `AggregateFn`; the §4.5(d) FILTER param shift; key-sort vs
innermost-aggregate-sort ordering; the emission rule (no `GROUPING` terms for a
single flat set); the count-of-groups subquery. **Negative tests:** depth 5 throws;
cube at depth 4 throws; a column outside `allowedColumns` throws; an uppercase
identifier throws; a `currency`/`date` key is refused; `sum` on a `string` column is
refused; two `countDistinct` are refused; an ancestor-ranking aggregate sort throws.
`expand-grouping-sets.util.test.ts` asserts set counts (n+1, 2ⁿ) and canonical order
independently of SQL text.

**State reducers.** `resolveColumnGroupingUpdate` (add/remove/reorder/mode/clear);
`serializeGroupingToURL` ↔ `deserializeGroupingFromURL` round-trip including
malformed input degrading to "off"; `sanitizeGroupingByColumns` dropping unknown and
non-groupable keys; the expansion reducer including **re-application by path after a
refetch that changes the row set**.

**Integration against real Postgres** (`car_sales_db`, 500k rows — no fixture
needed; excluded from `test:ci`, which has no database):

- **Subtotal-null disambiguation** — the §1.7(a) case, asserting the two rows are
  distinguished by `group_mask` and that the mapper yields `'value'` vs
  `'aggregated'`. **The single most important test here.**
- `ROLLUP`/`CUBE` result-equivalence to explicit sets (the §1.7(b) `EXCEPT ALL` probe
  as a regression test) **plus an `EXPLAIN` comparison asserting matching plan
  shape** — converting §2.3's premise into a gate rather than an assumption.
- Ordering: subtotals immediately follow their children; grand total last; a DESC key
  does not invert the hierarchy; an innermost aggregate sort does not scramble it.
- Cardinality estimator against the real table, **plus a never-`ANALYZE`d table (no
  `pg_stats` row) and `reltuples = -1`** — §1.7(e).
- Timeout: `set_config` fires 57014 → `QueryCanceledError`, **and
  `SHOW statement_timeout` is back to the pool default on the next query using the
  same pooled connection** — §1.7(f) as a standing test.

**Interaction tests.** Grouped + sorted; + filtered; + a hidden group key (header
still renders it); + pinned (group header spans, subtotal respects pinning); + column
reorder (group order unchanged); expansion surviving a sort change and resetting on a
filter change that removes the path. Suspense-driven tests must wrap render in an
**awaited `act`** — RTL's `render` calls `act` un-awaited, so a `use()` tree
otherwise never leaves the fallback.

**A11y.** `role="treegrid"`; `aria-level` = `depth + 1`; `aria-expanded` only on
expandable rows; `aria-posinset`/`aria-setsize` within each level; exactly one
`tabIndex={0}`; Right/Left expand and collapse; focus moves to the ancestor when a
focused row's ancestor collapses. Slice 0 asserts the same for `role="grid"` on the
flat grid. New icons join the `Icons.test.tsx` render sweep.

**Gates.** `vp run typecheck:all` must fail if the two `GroupingState` copies drift,
and the full gate per `quality-gate-workflow` — including the three steps `vp check`
does not cover (`lint:eslint:check`, `lint:biome:check`, `react-doctor:verify`).

---

## 9. Risks

| #   | Risk                                                                                                                                                                                      | Mitigation                                                                                                                                                                            |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Slice 0 is a large prerequisite grouping does not visibly pay for** — it touches every row and cell component                                                                           | Ship it alone with its own value story (the grid becomes keyboard-accessible) and its own ADR, so grouping never blocks on relitigating it                                            |
| 2   | **Variable-height group rows would break the virtualizer** — a taller group header silently misaligns the whole body                                                                      | Design constraint, not a hope: all row kinds use the same `rowHeight`. Test the `offsetY + n×rowHeight + bottomSpacer === totalHeight` invariant under grouping                       |
| 3   | **The cardinality bound over-refuses on sparse data** — §1.7(g) measured it conservative ~2.5× (predicted 3 564, actual 1 422)                                                            | Why WARN-plus-`LIMIT`-backstop beats pure pre-flight refusal: the warn path still returns data. Revisit the bound with a sparsity factor if it bites                                  |
| 4   | **Estimates are wrong on a stale-statistics table**, so a "safe" query returns 200k rows                                                                                                  | Two independent backstops: the `LIMIT` at WARN+1 truncates, and the 10 s timeout bounds time. Never trust the estimate alone                                                          |
| 5   | **Expansion resetting on revalidation reads as a bug**                                                                                                                                    | Path-keyed re-application survives sort changes (the common case) and most filter changes. Document it; the escape hatch is `sessionStorage`, already used for tab-scoped table state |
| 6   | **Rolling out surfaces type gaps** that `enterprise-orders` alone does not exercise                                                                                                       | Proven up front by the §2.2 type probe, which owns a fixture carrying the awkward types, rather than by rolling the feature into the wide-column rendering playground                 |
| 7   | **The third `GroupingState` copy drifts** the way copies 3–5 of `ColumnFilter` already have (`api-shared`, both api-servers — none guarded)                                               | `groupingContract.test.ts` with the annotation form. Do **not** extend grouping to the api-server routes in v1 — that is what created the unguarded copies                            |
| 8   | **`@lcabrera/server`'s public surface grows**; `api-surface:verify` requires a changeset and new subpaths must land in **both** export maps                                               | Slice 1's checklist. Only 8 of 18 existing `query-builder` files are exported — export deliberately, not wholesale                                                                    |
| 9   | **Doc drift.** `packages/server/src/filters/ARCHITECTURE.md` and `packages/server/src/INVENTORY.md` still claim `@lcabrera/ui` re-exports the server's filter types — false since ADR-039 | Fix in Slice 1 rather than writing grouping docs by analogy and inheriting the error                                                                                                  |
| 10  | **`countDistinct` at cube depth 3** defeats the hash path once per grouping set                                                                                                           | Max one per query, and its presence tightens the guard thresholds (§4.2)                                                                                                              |

---

## 10. Open questions

Four questions raised during the session were resolved; two of the resolutions
changed the design rather than just filling a blank.

| #   | Was                    | Resolution                                                                                                                                                                                                    |
| --- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Which icons?           | Five new bundles following the 16×16 `FilterIcon` family — concrete `GroupIcon` path in §3.3                                                                                                                  |
| 2   | Which routes?          | **All of them.** Drove §2.2 — generic derivation from `dataType` + a `crud`-style flag, which _removed_ the per-entity grouping catalog from the plan                                                         |
| 3   | Grand-total placement? | **User-configurable** in `GeneralSettingsSection`, persisted via `PersistedUiState` (Slice 8) — not a hardcoded design call                                                                                   |
| 4   | Is the DB seeded?      | **Yes — 500k rows in `car_sales_db`.** The earlier "no data" finding was wrong: it queried the `postgres` maintenance database. Corrected in §1.7, and the real data now calibrates the guard rails (§1.7(g)) |

**Remaining, genuinely open — non-blocking:**

| Question                                                                                                                                                                                                                                                     | Decider                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| Are the 5 000 / 50 000 thresholds right for production volumes? §1.7(g) shows realistic groupings of a 500k-row table land near 1 400, so they currently guard only the pathological case — which may mean they are too loose to be useful, or exactly right | Lucio, after Slice 5 ships with telemetry |
| At what column count does the group-by picker UX, rather than the SQL, become the binding constraint on depth?                                                                                                                                               | Lucio / design, at Slice 7                |

---

## Verification

**Per slice**, from `apps/react-router/` unless noted:

```bash
vp fmt .                    # 1  Oxfmt (also formats .md — doc edits need this)
vp lint .                   # 2  Oxlint
vp run lint:eslint:check    # 3  NOT covered by `vp check`
vp run lint:biome:check     # 4  from the ROOT
vp run react-doctor:verify  # 5  from the ROOT
vp check                    # 6  fmt + Oxlint + tsgolint
vp run typecheck            # 7  real tsc — NOT the same pass as 6
vp run test                 # 8  never `vp test`
```

From the root: `vp run typecheck:all` (the `GroupingState` conformance test lives in
the app and only fails there), `vp run test:ci` before pushing without a database,
`vp run adr:verify` after each ADR, and `vp run publish:verify` +
`vp run api-surface:verify` after touching `packages/server`'s exports.

**End-to-end**, with `vp run db:up` and `vp run dev`:

1. `/enterprise-orders` → group by `order_status` from the header menu.
2. Confirm the URL gains `?grouping=…` and is **restorable in a fresh tab**.
3. Confirm the network shows **one** navigation, not one per interaction.
4. From Slice 3: group by `shipping_country` under rollup and confirm a real-NULL row
   renders as the null affordance while the subtotal renders "All …" — the §1.7(a)
   case verified in the UI, not only in SQL.
5. From Slice 5: cube over three high-cardinality columns → the refusal names the
   offending column rather than timing out. Group by `order_id` → refused as
   unique-ish (it plans at 500 001 rows).
6. From Slice 4: keyboard only — `Tab` in, arrow to a group row, `Right`/`Left` to
   expand/collapse, and confirm focus lands on the ancestor when a collapse removes
   the focused row. Verify with a screen reader that level and expansion state are
   announced.
7. From Slice 7: repeat 1–4 on a second SQL-backed route with no code change
   beyond its `grouping` flag — that is the test of §2.2's genericity. Not
   `wide-alltypes-150`, which is a rendering playground rather than a domain
   schema; §2.2's genericity is proven by the type probe instead.

**Coordination:** claim before starting — `vp run coordination:verify` for overlap,
then `vp run coordination:claim -- <id> "<title>" --new-issue
--area 'packages/ui/src/components/Table/**' --area 'packages/server/src/db/**'`.
Note `coordination:claim` creates a **new worktree** off `origin/main` and opens a
draft PR, so claim **before** writing code and use `gh pr edit`, not `gh pr create`.
