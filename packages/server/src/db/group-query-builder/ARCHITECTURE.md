# Group Query Builder Architecture

Pure construction and resolution for **grouped** reads, the sibling of
`../query-builder/` and held to the same rule: no DB access lives here, so the
whole suite runs without a database (ADR-032). The one impure partner is
`../get-column-grouping-capabilities.util.ts`, which pairs the query this folder
builds with `runQuery`.

What exists today is the **capability half**: which columns may be a group key,
which aggregates are legal for each, and why a column was refused. The emission
half — `GROUPING SETS`, the variadic mask, aggregate projection and ordering —
lands beside it.

## The two gates

[ADR-058](../../../../../docs/decisions/ADR-058-grouping-legality-by-analytical-role.md)
is the decision this folder implements, and its shape is the thing to preserve:
a column must clear **both** gates, and they refuse different things.

| Gate                    | Question                     | Answered by                                                                 |
| ----------------------- | ---------------------------- | --------------------------------------------------------------------------- |
| **1 — analytical role** | Is this worth offering?      | `resolve-analytical-role.util.ts`, from `pg_type.typcategory`               |
| **2 — the catalogue**   | Can Postgres actually do it? | `build-column-capabilities-query.util.ts`, from `pg_opclass`/`pg_aggregate` |

Gate 2 alone is not enough — `jsonb` **has** an equality operator, so a
catalogue-only rule offers a column the Table cannot render. Gate 1 alone is not
enough either — it cannot know what an extension or domain type supports. The
composition is what makes the answer both safe and generic.

**Gate 1 is a derivation, not a hand-kept type list**, and that is deliberate:
`typcategory` already partitions Postgres's types exactly along the dimension /
fact / neither line, so `citext`, a domain over `text` and a future string type
all resolve without anyone adding an entry. Anything unrecognised falls through
to `unsupported`, which is what lets the excluded set stay non-exhaustive and
still be safe.

## Files

| File                                      | Role                                                                                                                                                |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `group-query-builder.types.ts`            | `AggregateFn`, `ColumnAnalyticalRole`, `GroupKeyRefusalReason`, `DistinctEstimate`, and the capability row/result types                             |
| `aggregate-sql.constants.ts`              | `AGGREGATE_SQL` — the closed `Record<AggregateFn, AggregateSpec>` map — plus the distinct SQL names the catalogue is probed with                    |
| `group-key-bounds.constants.ts`           | The distinct-value ceiling for a group key and the unique-ish ratio                                                                                 |
| `resolve-analytical-role.util.ts`         | **Gate 1.** `pg_type.typcategory` → dimension / fact / unsupported                                                                                  |
| `build-column-capabilities-query.util.ts` | **Gate 2.** One bound-parameter catalogue query: equality operator, per-aggregate existence, and `pg_stats`/`reltuples`, for every requested column |
| `resolve-distinct-estimate.util.ts`       | `n_distinct` → a known count, genuinely unknown, or undefined distinctness — three outcomes on purpose                                              |
| `to-role-aggregates.util.ts`              | Both gates applied to the aggregate menu: the role sets the ceiling, the catalogue removes what does not exist                                      |
| `resolve-column-capability.util.ts`       | **Public entry point.** One catalogue row → one `ColumnGroupingCapability`, refusal reason included                                                 |

## Three traps this folder already pays for

Each was found by running the query against a live fixture, and each returns a
clean, plausible, wrong answer if you drop it.

1. **`varchar` owns no operator class.** It borrows `text`'s through binary
   coercion, so an equality check that looks only for an exact `opcintype` match
   refuses every `varchar` column. The same applies to an enum, whose class is
   registered against `anyenum`, and to arrays via `anyarray`.
2. **`count` is the only universal aggregate.** `min`/`max` have pseudo-typed
   variants (`anyarray`, `anyenum`, `record`) that a blanket "argument is a
   pseudotype" test matches, which then offers `min` on a boolean — an aggregate
   Postgres does not define. The variants have to be expanded precisely.
3. **`n_distinct = 0` is not "not analysed yet".** An unanalysed table has no
   `pg_stats` row at all; the zero survives an explicit `ANALYZE` and means the
   type has no equality operator. Reading it as unknown points the guard rail's
   warn-and-proceed branch at exactly the unsafe case.

`../../../../../apps/react-router/src/.server/groupingCapability.smoke.test.ts`
is the live-Postgres proof for all three, since a mocked row cannot show any of
them. It is gated behind `SMOKE_DB`.

## Refusal reasons

A refused column carries one reason, and the order they are tested in is part of
the contract — the most useful message wins. The role check runs first, so a
`point` column is refused as `not-a-dimension` rather than
`no-equality-operator`: the first is a sentence a user understands.

| Reason                 | Fires when                                                                  |
| ---------------------- | --------------------------------------------------------------------------- |
| `not-a-dimension`      | Gate 1 resolved `unsupported`                                               |
| `no-equality-operator` | the type resolves no default btree/hash operator class, or `n_distinct = 0` |
| `unique-ish`           | the distinct estimate is at or near the row count — the primary-key mistake |
| `stats-unavailable`    | a **fact** with no statistics, so low cardinality cannot be demonstrated    |
| `too-many-distinct`    | a known estimate above the group-key ceiling                                |

A **dimension** with unavailable statistics is still groupable: refusing would
make grouping dead on a freshly restored database, and the result-size backstop
covers the risk. A **fact** is not, because a fact is a measure and guessing
"yes" on an amount column is the expensive direction.
