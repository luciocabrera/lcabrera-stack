# Group-key and aggregate legality comes from the Postgres catalog, not from `TableColumnDataType`

**Status:** Proposed

<!-- Draft — no number until adoption (see README.md). Home at adoption:
     docs/decisions/, because the code is entirely in packages/server and
     packages/ui, and ADR-048's CQMS test leaves both candidate homes standing. -->

## Context

Row grouping must work on every table route the way filtering and sorting already
do, driven off what routes already declare rather than a per-entity catalogue
someone has to maintain. The design that came out of the planning session
proposed deriving two things from `TableColumn.dataType`:

- **which columns may be grouped** — `string` and `boolean` always, `number` when
  low-cardinality, `currency` and raw `date` never;
- **which aggregates are legal** — a fixed table per `dataType`.

The argument was that `TableColumnDataType` is coarser than the real Postgres
type but sufficient, because "it never lets an illegal aggregate be emitted", and
that the one distinction it cannot make (`integer` versus `numeric`) is moot since
`sum`/`avg`/`count` all arrive from the driver as strings either way.

Two facts about the tree bound the decision. `TableColumnDataType` has five
members (`boolean`, `currency`, `date`, `number`, `string`); the server's own
`ColumnType` has five different ones. And `TableColumn.dataType` is **optional** —
the established precedent in `isFilterCompatibleWithColumn.util.ts` treats an
undeclared type as `string`.

## Problem

The premise is false in both directions, and the failure is silent.

`apps/react-router/src/routes/wide-alltypes-150/WideAlltypes150.constants.ts`
generates its columns, collapsing 20 real Postgres types into the five-member
vocabulary. Probed against the live table:

- `c_018` is `point`, mapped to `string` — the type the design calls "the best
  key". `GROUP BY c_018` raises `could not identify an equality operator for type
point`.
- `c_014` is `jsonb`, also mapped to `string`. `min(jsonb)` does not exist. But
  `GROUP BY c_014` **succeeds** — jsonb has equality. So the failure is per-type,
  not per-family, and no coarsening of the vocabulary can capture it.
- `c_003` is `numeric`, mapped to `string`. So `sum` and `avg` are never offered
  on a column that supports them. The vocabulary **forbids legal aggregates** as
  well as permitting illegal ones.

The guard rail then routes the failure into execution rather than catching it.
`pg_stats.n_distinct` for `c_018` is `0`, and the design's resolution table maps
`n_distinct = 0` to UNKNOWN, and UNKNOWN to "warn and proceed, never refuse" —
so the safety valve points at exactly the unsafe branch.

The obvious confound is a never-`ANALYZE`d table, which also produces no usable
statistic. The discriminating probe is to run `ANALYZE` and look again: the
`pg_stats` row **exists** and `n_distinct` is **still `0`**, while `c_014` reads
`-1` and `c_019` reads `1000`. `0` is not "unknown" — it is Postgres stating that
the type has no equality operator, so distinctness is undefined. The design
conflates two meanings of one value.

Because `dataType` is optional and defaults to the most permissive member, the
same table also makes **every column with no declared type** "the best key".
`apps/admin_system` declares a `dataType` on a minority of its columns.

## Options considered

1. **Keep `dataType` as the authority and add an exclusion list.** Rejected: the
   list is per-database-type, so it is the catalogue the design set out to avoid,
   re-introduced under another name and maintained by hand in the one place
   nobody looks until it is wrong.
2. **Widen `TableColumnDataType` to carry the real Postgres type.** Rejected: it
   is a UI presentation vocabulary that drives formatters and filter inputs;
   widening it to 20+ members changes every consumer, and a published package's
   type union is not a free thing to grow. It also still would not answer which
   aggregates exist for a type — that is a catalogue lookup either way.
3. **Ask the catalogue at request time. `Chosen.`** `dataType` seeds the menu as a
   hint; `pg_type`, `pg_operator` and `pg_aggregate` decide legality.
4. **Introspect once at build time and generate a type map.** Rejected: it
   re-introduces the codegen step the design explicitly avoided, and it goes stale
   against a migrated database in the direction that fails open.

## Decision

`TableColumnDataType` **seeds the aggregate menu**. The **Postgres catalogue
decides** what is legal.

A single bound-parameter query resolves, per column: whether the column's type has
an equality operator (so it can appear in `GROUP BY`), and which of the supported
aggregate functions exist for that type. It joins `pg_attribute` to `pg_type`, to
`pg_operator` for equality, and to `pg_aggregate`/`pg_proc` for per-function
existence. Schema, table and the column list are all bound parameters, so the
query has no identifier-interpolation surface.

This costs **no extra round trip**: the cardinality guard already issues one
catalogue query per grouped request, and this merges into it.

Refusals are specific and distinguishable — `no-equality-operator`, `unique-ish`,
and `too-many-distinct` are three different messages, because grouping by a
primary key is the likeliest user mistake and deserves to say so.

`n_distinct = 0` is **never** read as UNKNOWN. Genuinely absent statistics (no
`pg_stats` row at all, or `reltuples <= 0`) remain UNKNOWN and still warn-and-
proceed behind the row-limit backstop.

A column with **no declared `dataType`** is not groupable by default. The
permissive `string` fallback stays where it already is, in filter compatibility;
it is not extended to grouping, where the failure mode is a rejected query rather
than an unhelpful filter input.

## Consequences

**What this costs.** Group-key eligibility is no longer answerable in the browser
— the UI can shape a menu from `dataType`, but the authoritative answer arrives
with the response. That means a user can pick a column the server then refuses,
so the refusal has to be a first-class rendered state, not an error toast. The
menu-versus-truth gap is the price of not maintaining a type catalogue by hand.

The catalogue query is Postgres-specific, which the design already accepted —
dialect abstraction is a stated non-goal.

A column whose type supports an aggregate through an implicit cast may be refused
where a hand-written query would have worked. That is the safe direction, and the
tests assert the refusal _reason_ rather than only the boolean so the case is
visible when it bites.

**What this buys.** The genericity claim becomes true rather than aspirational,
and `wide-alltypes-150` becomes the test that proves it instead of the route that
breaks it. No second catalogue can drift from the first, because there is no
second catalogue.

## Alternatives considered

**Rejected on evidence: `dataType` as the authority.** Three probes against the
live table each falsify it — `point` fails `GROUP BY` while mapped to the type the
design calls the best key, `min(jsonb)` does not exist while `GROUP BY jsonb`
succeeds, and `numeric` mapped to `string` hides `sum`. A fourth probe (`ANALYZE`
then re-read `pg_stats`) rules out the stale-statistics explanation for the
`n_distinct = 0` case, which is what turns a warning into a refusal-that-never-
fires.

**Rejected: costed `EXPLAIN` as the legality gate.** It answers cost, not
legality — an illegal aggregate fails to parse, so `EXPLAIN` returns the same
error the query would, one round trip earlier and with no better message.

## References

- `docs/agents/planning/table-row-grouping-plan.md` §2.2, §4.2, §2.8
- [ADR-038](../../../decisions/ADR-038-public-package-topology-by-runtime.md) — the runtime split this stays inside
- [ADR-039](../../../decisions/ADR-039-duplicate-over-undeclared-edges.md) — why the two type vocabularies are not merged
- Backlog entries P-01 (the probe, landed as a test), P-03 (this ADR), P-14 (the implementation)
