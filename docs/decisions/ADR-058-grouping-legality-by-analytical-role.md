# ADR-058 — Gate grouping legality on analytical role, with the Postgres catalogue as the floor

- **Status:** Accepted
- **Date:** 2026-08-11
- **Scope:** `@lcabrera/server` (`db/`), `@lcabrera/ui` (`components/Table`, `routing/shared`), the grouped-read path in `apps/react-router`
- **Issue:** #552 — evidence from #550, implemented by #563
- **Related:** ADR-038 (public package topology by runtime), ADR-039 (duplicate over undeclared edges), ADR-056 (one generic table route data path)

## Context

Row grouping must work on every table route the way filtering and sorting
already do, driven off what routes already declare rather than a per-entity
catalogue someone has to maintain. The design in
[`table-row-grouping-plan.md`](../agents/planning/table-row-grouping-plan.md)
proposed deriving two things from `TableColumn.dataType`:

- **which columns may be grouped** — `string` and `boolean` always, `number` when
  low-cardinality, `currency` and raw `date` never;
- **which aggregates are legal** — a fixed table per `dataType`.

The argument was that `TableColumnDataType` is coarser than the real Postgres
type but sufficient, because "it never lets an illegal aggregate be emitted", and
that the one distinction it cannot make (`integer` versus `numeric`) is moot
since `sum`/`avg`/`count` all arrive from the driver as strings either way.

Two facts about the tree bound the decision. `TableColumnDataType` has five
members (`boolean`, `currency`, `date`, `number`, `string`); the server's own
`ColumnType` has five different ones. And `TableColumn.dataType` is **optional** —
the established precedent in
[`isFilterCompatibleWithColumn.util.ts`](../../packages/ui/src/routing/shared/isFilterCompatibleWithColumn.util.ts)
treats an undeclared type as `string`, via an explicit `case undefined:` that
falls through to the `string` branch.

## Problem

The premise is false in both directions, and the failure is silent.

Any table carrying a `point`, `jsonb` or `numeric` column shows it, because the
five-member vocabulary reports all three as `string`. Probed against a
purpose-built fixture
([`groupingLegality.smoke.test.ts`](../../apps/showcase/src/.server/groupingLegality.smoke.test.ts),
which creates and drops its own three-column table):

- a `point` column maps to `string` — the type the design calls "the best key".
  `GROUP BY` on it raises `could not identify an equality operator for type
point`.
- a `jsonb` column also maps to `string`. `min(jsonb)` does not exist. But
  `GROUP BY` on it **succeeds** — jsonb has equality. So the failure is per-type,
  not per-family, and no coarsening of the vocabulary can capture it.
- a `numeric` column also maps to `string`. So `sum` and `avg` are never offered
  on a column that supports them. The vocabulary **forbids legal aggregates** as
  well as permitting illegal ones.

The guard rail then routes the failure into execution rather than catching it.
`pg_stats.n_distinct` for the `point` column is `0`, and the design's resolution
table maps `n_distinct = 0` to UNKNOWN, and UNKNOWN to "warn and proceed, never
refuse" — so the safety valve points at exactly the unsafe branch.

The obvious confound is a never-`ANALYZE`d table, which also produces no usable
statistic. The fixture rules it out twice. `ANALYZE` runs before the assertions,
and the `pg_stats` row then **exists** with `n_distinct` **still `0`**, while the
`jsonb` and `numeric` columns report their real counts. And the `point` column is
seeded with distinct values well above any plausible "too few to matter"
threshold — counted through a `::text` cast, the only way to distinguish them
without an equality operator — so `0` cannot be read that way either. `0` is not
"unknown": it is Postgres stating that the type has no equality operator, so
distinctness is undefined. The design conflates two meanings of one value.

Because `dataType` is optional and defaults to the most permissive member, the
same table also makes **every column with no declared type** "the best key".
Most of the other app's table columns declared no `dataType` at all
(`grep -c 'dataType:'` against its `*.constants.tsx` versus the `label:` every
column carries).

## Options considered

1. **Keep `dataType` as the authority and add an exclusion list.** Rejected: the
   list is per-database-type, so it is the catalogue the design set out to avoid,
   re-introduced under another name and maintained by hand in the one place
   nobody looks until it is wrong.
2. **Widen `TableColumnDataType` to carry the real Postgres type.** Rejected: it
   is a UI presentation vocabulary that drives formatters and filter inputs;
   widening it to the full type list changes every consumer, and a published
   package's type union is not a free thing to grow. It also still would not
   answer which aggregates exist for a type — that is a catalogue lookup either
   way.
3. **Ask the catalogue at request time, and treat its answer as final.** Rejected
   on the probe's own evidence: `jsonb` has an equality operator, so a
   catalogue-only rule offers it as a group key — a column the Table cannot even
   render. The catalogue answers what Postgres _can_ do, never what is worth
   offering.
4. **Classify by analytical role, with the catalogue as a floor. `Chosen.`**
   Dimensions are grouped, facts are aggregated, and everything else is out.
   `dataType` seeds the menu as a hint; the role table decides what is offered;
   the catalogue backstops anything the role table has no opinion about.
5. **Introspect once at build time and generate a type map.** Rejected: it
   re-introduces the codegen step the design explicitly avoided, and it goes
   stale against a migrated database in the direction that fails open.

## Decision

Legality is decided by **two gates, and a column must clear both**. The catalogue
is the floor — it rules out what Postgres cannot do. The **analytical role** is
the bar — it rules out what makes no sense to offer.

### Gate 1 — the analytical role, derived from the real Postgres type

Every column resolves to exactly one of three roles:

| Role                       | Real types                                                                            | May be a group key                     | May be aggregated                      |
| -------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------- | -------------------------------------- |
| **Dimension**              | `text`, `varchar`, `char`, enum, `boolean`, date/timestamp, `inet`/`cidr`             | **yes** — this is what grouping is for | `count`, `countDistinct`, `min`, `max` |
| **Dimension** (identifier) | `uuid`                                                                                | only when demonstrably low-cardinality | `count`, `countDistinct`               |
| **Fact**                   | `numeric`, `int2/4/8`, `float4/8`, money, `interval`                                  | only when demonstrably low-cardinality | `sum`, `avg`, `min`, `max`, `count`    |
| **Unsupported**            | `jsonb`, `json`, `point` and the geometric family, arrays, `bytea`, `xml`, `tsvector` | **no**                                 | **no**                                 |

This is the dimension/fact split analytics has always had: you group by a
country, a city or a category, and you aggregate an amount, a quantity, a price
or a cost. A column that is neither is not an analytical column at all.

**`Unsupported` is the part the catalogue alone gets wrong**, and the reason this
gate exists rather than deferring everything to Postgres. `jsonb` _has_ an
equality operator, so `GROUP BY` on it parses and runs — the probe asserts
exactly that. A catalogue-only rule would therefore offer it. But grouping by a
JSON document is analytically meaningless, its equality is structural rather than
semantic, and the Table cannot render it as a cell value in the first place, so a
group header built from one would be unreadable. The same holds for `point` and
the rest of the geometric family.

The rule that follows: **a type the Table cannot display is not a type it can
group, filter or sort by.** Renderability is the outer boundary, and grouping
sits inside it. Supporting these types at all is a separate piece of work — a
display strategy first, then extraction expressions such as `jsonb` path keys or
`point` components — and is explicitly out of scope here.

### Gate 2 — the catalogue, as defence in depth

For a column that clears Gate 1, a single bound-parameter query resolves whether
its type has an equality operator (so it can appear in `GROUP BY`) and which of
the supported aggregate functions exist for it. It joins `pg_attribute` to
`pg_type`, to `pg_operator` for equality, and to `pg_aggregate`/`pg_proc` for
per-function existence. Schema, table and the column list are all bound
parameters, so the query has no identifier-interpolation surface.

Gate 2 is not redundant. It catches a domain type, an extension type or a future
addition that the role table has no opinion about, and it is what keeps the
`Unsupported` list from having to be exhaustive to be safe — an unknown type
fails Gate 1 by default, and would fail Gate 2 anyway if it lacked the operator.

This costs **no extra round trip**: the cardinality guard already issues one
catalogue query per grouped request, and this merges into it.

Refusals are specific and distinguishable — `no-equality-operator`, `unique-ish`,
`too-many-distinct` and `not-a-dimension` are different reasons, because grouping
by a primary key is the likeliest user mistake and deserves to say so.

`n_distinct = 0` is **never** read as UNKNOWN. Genuinely absent statistics (no
`pg_stats` row at all, or `reltuples <= 0`) remain UNKNOWN and still
warn-and-proceed behind the row-limit backstop.

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

The `Unsupported` list is a judgement, not a derivation — someone has to decide
that `jsonb` is out, and a future consumer with a genuine need (grouping by a
`jsonb` path key, or by `point`'s x component) will read that decision as a
limitation rather than a definition. That is the right default and the wrong
permanent answer; the way out is expression keys, not loosening the list.

**What this buys.** The genericity claim becomes true rather than aspirational,
and it is provable against a fixture the probe owns rather than against whichever
route happens to carry an awkward type today. No second catalogue can drift from
the first, because there is no second catalogue.

The role table also gives the UI something the catalogue never could: a reason a
column is absent from the picker. "Not a dimension" is a sentence a user
understands; "no equality operator for type point" is not.

## Alternatives considered

**Rejected on evidence: `dataType` as the authority.** Three probes against a
live database each falsify it — `point` fails `GROUP BY` while mapped to the type
the design calls the best key, `min(jsonb)` does not exist while `GROUP BY jsonb`
succeeds, and `numeric` mapped to `string` hides `sum`. A fourth probe (`ANALYZE`
then re-read `pg_stats`) rules out the stale-statistics explanation for the
`n_distinct = 0` case, which is what turns a warning into a refusal that never
fires.

**Rejected: the catalogue as the sole authority.** It answers capability, not
suitability. Every type the Table cannot render would pass it, `jsonb` first.

**Rejected: costed `EXPLAIN` as the legality gate.** It answers cost, not
legality — an illegal aggregate fails to parse, so `EXPLAIN` returns the same
error the query would, one round trip earlier and with no better message.

## Amendments

**2026-08-12 — `inet`/`cidr` admitted as dimensions, `interval` as a fact
(#598).** The original role table was sized for the types the showcase schemas
carry and left three real ones unaddressed, each refused by Gate 1's default
deny. A live probe (PostgreSQL 18.4) settled two of them without weakening the
gate: `interval` is the sole member of type category `T`, and `inet`/`cidr` are
the only members of category `I`, so admitting each category admits nothing else,
now or later. `interval` is a **fact** rather than a date-like dimension because
Postgres defines `sum` and `avg` for it and for no other non-numeric type — the
one place the catalogue decides which role a type takes.

Two consequences worth stating rather than rediscovering:

- **An `interval` group key normalises its values.** `interval` comparison
  flattens 30 days to the month and 24 hours to the day, so `'1 mon'`,
  `'30 days'` and `'720 hours'` are one group, rendered with one of the three as
  its label. The decision is to accept this and have the UI say the key is
  normalised; a grouped read on a duration answers a coarser question than the
  cell displays.
- **Grouping a raw `inet` is legal but rarely what is wanted.** The useful key is
  `network()` or `masklen()`, an expression the builder has no concept of. That
  remains out of scope and belongs to #562, not to this gate.

One incidental correction the probe produced: PostgreSQL 18.4 defines **no
`min(uuid)`/`max(uuid)`** even though `uuid` sorts. Gate 2 already reports this
correctly, and it is the clearest example of why the role table's aggregate
column is a ceiling and not a promise.

**2026-08-12 — `uuid` admitted as a dimension, by name, with statistics required
(#599).** This is the one place Gate 1 is not a derivation, and the reason is
specific: Postgres files `uuid` under type category `U` beside `jsonb`, `xml`,
`bytea` and `tsvector`, so no structural property of a catalogue row separates
it from them. A `uuid` row and a `jsonb` row report the same category, the same
equality answer and the same `{count}` aggregate set; only `typname` differs.
The category therefore cannot admit `uuid` alone, and the type is named instead.

The trade was made because the practical case is strong and the risk was already
covered. Grouping by `tenant_id` or `region_id` is exactly what grouping is for,
and the pre-existing `unique-ish` guard refuses a primary-key `uuid` on
statistics alone, so admitting the type does not admit the mistake.

Two rules keep the exception honest:

- **It is a name check, not a category entry.** `IDENTIFIER_TYPE_NAMES` in
  `packages/server/src/db/group-query-builder/` holds it, the check runs ahead of
  the category lookup, and the unit and smoke suites both assert that a `jsonb`
  column is still refused — so reaching a future identifier type by widening `U`
  fails loudly rather than passing.
- **The name is schema-qualified** (`pg_catalog.uuid`), because type names are
  per-schema. `CREATE TYPE app.uuid AS (a int, b int)` yields a **composite**
  whose `typname` is `uuid`, so a bare-name match would admit an unrenderable
  type as a dimension — the precise failure this gate exists to prevent. The
  capability query therefore carries the type's namespace alongside its name, and
  the smoke fixture creates such a shadowing type so the distinction is proved
  against a real catalogue rather than asserted.
- **An identifier clears the fact's cardinality bar, not the dimension's.** An
  ordinary dimension with no statistics is grouped anyway, because refusing would
  make grouping dead on a freshly restored database. That is benign for `text`
  and too generous for `uuid`, which is far more often a key than a label, so a
  `uuid` with no statistics is refused `stats-unavailable` until `ANALYZE` has
  run.

`IDENTIFIER_TYPE_NAMES` should stay small. Every entry is a type someone
maintains by hand, which is the cost the category derivation exists to avoid.

## References

- [`table-row-grouping-plan.md`](../agents/planning/table-row-grouping-plan.md) §2.2, §4.2, §2.8
- [`row-grouping-planning-summary.md`](../agents/planning/row-grouping-planning-summary.md) — the session that filed the backlog
- [ADR-038](./ADR-038-public-package-topology-by-runtime.md) — the runtime split this stays inside
- [ADR-039](./ADR-039-duplicate-over-undeclared-edges.md) — why the two type vocabularies are not merged
- Issues #550 (the probe, landed as a test), #552 (this ADR), #563 (the resolver)
