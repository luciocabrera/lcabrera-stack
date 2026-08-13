# Group Query Builder Architecture

Pure construction and resolution for **grouped** reads, the sibling of
`../query-builder/` and held to the same rule: no DB access lives here, so the
whole suite runs without a database (ADR-032). The one impure partner is
`../get-column-grouping-capabilities.util.ts`, which pairs the query this folder
builds with `runQuery`.

The folder has three halves — two entry points and one rail set they share.

- **Capability** — which columns may be a group key, which aggregates are legal
  for each, and why a column was refused. `resolveColumnCapability`, decided by
  [ADR-058](../../../../../docs/decisions/ADR-058-grouping-legality-by-analytical-role.md).
- **Emission** — `GROUPING SETS`, the variadic mask, aggregate projection and
  ordering. `buildGroupQuery`, decided by
  [ADR-059](../../../../../docs/decisions/ADR-059-aggregation-is-builder-generated.md).
- **Guard rails** — how large the result will be, whether that is allowed, and
  what `LIMIT` it runs under. `resolveGroupGuardRails`, decided by
  [ADR-066](../../../../../docs/decisions/ADR-066-grouping-guard-rails-and-per-query-timeout.md).
  Called from inside `buildGroupQuery`, after the legality gates, so the emitted
  `LIMIT` is the rails' answer and not the requested `maxRows`.

They are joined by a **descriptor field, not an import**: `buildGroupQuery`
takes the capability map the other half resolved and refuses anything the
catalogue turned down. That is what lets a pure function enforce ADR-058 —
the impure half answers "what is legal here", this one refuses everything else.
Re-deriving legality inside the builder is the design ADR-058 supersedes, and
the reason is in its Context: the type vocabulary available to a pure function
maps `point` and `jsonb` onto the same value it maps `text` onto.

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

**Where that property runs out — read this before adding a category.** A category
may be admitted only when every type in it is one we want, because the mapping
cannot say "this member but not that one". `I` (`inet`, `cidr`) and `T`
(`interval`) qualify: each holds nothing else. `U` does not — it holds `uuid`
alongside `jsonb`, `xml`, `bytea` and `tsvector`, and a `uuid` column is
identical to a `jsonb` one on **every** field the capability query returns: same
category, same equality answer, same `{count}` aggregate set.

So `uuid` is admitted **by name**, in `group-query-builder.constants.ts`, checked
ahead of the category lookup — the one place Gate 1 is not a derivation. `U`
itself stays refused, and both the unit and smoke suites assert that a `jsonb`
column is still turned away, so widening the category to reach a future
identifier type fails loudly instead of quietly admitting a document.

**The name is schema-qualified, and that is load-bearing.** Type names are
per-schema, so `CREATE TYPE app.uuid AS (a int, b int)` is a composite reporting
`typname = 'uuid'`. Matching the bare name would admit it — an unrenderable type
sailing through the gate built to stop exactly that. The capability query carries
the type's namespace for this reason alone, `is-identifier-type.util.ts` is the
one place the comparison happens, and the smoke fixture creates a shadowing type
so the distinction is proved against a live catalogue.

An identifier also clears the **fact's** cardinality bar rather than the
dimension's: `refuse-group-key.util.ts` reads the same constant and refuses a
`uuid` with no statistics as `stats-unavailable`. The ordinary dimension rule is
warn-and-proceed so grouping survives a fresh restore, which is benign for `text`
and too generous for a type that is usually a key. Keep that set small — every
entry is maintained by hand, which is the cost the category derivation avoids.

`interval` is the one type whose **role** the catalogue decides rather than
intuition: it looks date-like, and it is a fact, because Postgres defines `sum`
and `avg` for it and for no other non-numeric type. Its group keys normalise —
`'1 mon'`, `'30 days'` and `'720 hours'` are one group — which is legal,
documented in ADR-058, and something the UI has to surface rather than hide.

## Files

| File                                      | Role                                                                                                                                                                                   |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `group-query-builder.types.ts`            | `AggregateFn`, `ColumnAnalyticalRole`, `GroupKeyRefusalReason`, `DistinctEstimate`, and the capability row/result types                                                                |
| `group-query-builder.constants.ts`        | Every constant this folder owns, in one file per the domain-folder rule: the `AGGREGATE_SQL` map and probe names, the group-key bounds, and the schema-qualified identifier exceptions |
| `is-identifier-type.util.ts`              | The one place that comparison happens; both the role gate and the refusal rules consult it so they cannot drift                                                                        |
| `resolve-analytical-role.util.ts`         | **Gate 1.** `pg_type.typcategory` → dimension / fact / unsupported. Admit a category only when every member belongs (see above)                                                        |
| `build-column-capabilities-query.util.ts` | **Gate 2.** One bound-parameter catalogue query: equality operator, per-aggregate existence, and `pg_stats`/`reltuples`, for every requested column                                    |
| `resolve-distinct-estimate.util.ts`       | `n_distinct` → a known count, genuinely unknown, or undefined distinctness — three outcomes on purpose                                                                                 |
| `to-role-aggregates.util.ts`              | Both gates applied to the aggregate menu: the role sets the ceiling, the catalogue removes what does not exist                                                                         |
| `resolve-column-capability.util.ts`       | **Public entry point.** One catalogue row → one `ColumnGroupingCapability`, refusal reason included                                                                                    |
| `expand-grouping-sets.util.ts`            | Grouping mode → the ordered sets, over key names rather than SQL, so its suite is array equality                                                                                       |
| `to-grouping-set-mask.util.ts`            | One set → the `GROUPING()` integer, the only thing separating a structural NULL from a real one                                                                                        |
| `assert-group-depth.util.ts`              | The capability-free half of the key rules — non-empty, within the depth cap, no repeats. Split out so the executor can run it **before borrowing a connection**                        |
| `assert-group-keys.util.ts`               | `assertGroupDepth` plus the allowlist and the catalogue's own refusal                                                                                                                  |
| `estimate-group-cardinality.util.ts`      | The pre-flight row bound, summed over the sets `expandGroupingSets` will emit — so a new mode needs no formula here                                                                    |
| `resolve-widest-group-key.util.ts`        | Which key contributes most to that bound, i.e. which one a refusal should name                                                                                                         |
| `assert-group-cardinality.util.ts`        | Refuse / warn / say nothing, against the two thresholds. Unknown statistics warn — never refuse                                                                                        |
| `resolve-group-row-limit.util.ts`         | The `LIMIT` the read runs under, and whether reaching it is a refusal or a truncation the caller asked for                                                                             |
| `assert-group-row-backstop.util.ts`       | The post-execution half of that: a result that reached the guard's own ceiling is refused, not returned short                                                                          |
| `resolve-group-guard-rails.util.ts`       | The three rails as one answer, so `buildGroupQuery` gains one call rather than three                                                                                                   |
| `assert-group-aggregates.util.ts`         | Every requested `{column, fn}` against the catalogue's menu, plus the one-`countDistinct` budget                                                                                       |
| `resolve-aggregate-alias.util.ts`         | `count(*)` → `count_rows`, otherwise `${fn}_${column}` with `distinct` folded into the prefix                                                                                          |
| `assert-group-aliases.util.ts`            | The identifier-length refusal and the collision rules — see the fourth trap below                                                                                                      |
| `build-aggregate-projection.util.ts`      | The aggregate half of the SELECT list, and where `FILTER (WHERE …)` claims the leading `$n`                                                                                            |
| `build-grouping-sets-clause.util.ts`      | `GROUP BY GROUPING SETS (…)`, the one grouping construct emitted                                                                                                                       |
| `build-group-order-by-clause.util.ts`     | `GROUPING(key) <placement>, key <user>` per key, then aggregates — and why no `NULLS` keyword appears                                                                                  |
| `build-group-query.util.ts`               | **Public entry point.** One `GroupQueryDescriptor` → the SQL, its values, and the keys and masks needed to decode the result                                                           |

## Four traps this folder already pays for

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
4. **An over-long alias loses a column, and nothing raises.** Postgres truncates
   an identifier past 63 bytes with only a `NOTICE`, and `pg` then returns one
   row object in which the second of two truncation-equal aliases has
   overwritten the first — the first column is not mangled, it is gone. Probed
   in ADR-059: two aliases sharing 63 characters gave two notices, no error, and
   `Object.keys(row)` of length one. So an over-long alias is refused at
   construction, with an explicit shorter `alias` as the escape hatch.

`../../../../../apps/react-router/src/.server/groupingCapability.smoke.test.ts`
is the live-Postgres proof for the first three, since a mocked row cannot show
any of them. It is gated behind `SMOKE_DB`.

## Refusal reasons

A refused column carries one reason, and the order they are tested in is part of
the contract — the most useful message wins. The role check runs first, so a
`point` column is refused as `not-a-dimension` rather than
`no-equality-operator`: the first is a sentence a user understands.

**The pairing is the type, not a convention.** `ColumnGroupingCapability` is
discriminated on `canGroup`, so the refused arm _requires_ `refusal`. That began
as a doc comment and a habit, which was enough right up until a hand-built
capability map could make the builder report `not a legal group key: undefined`.
A column refused for no reason is not a state worth being able to write down, so
the flag and its reason move together. `refusal?: never` on the groupable arm
keeps `capability.refusal` readable without narrowing, which is what a consumer
rendering the reason actually wants.

| Reason                 | Fires when                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| `not-a-dimension`      | Gate 1 resolved `unsupported`                                                                 |
| `no-equality-operator` | the type resolves no default btree/hash operator class, or `n_distinct = 0`                   |
| `unique-ish`           | the distinct estimate is at or near the row count — the primary-key mistake                   |
| `stats-unavailable`    | a **fact** or an **identifier** with no statistics, so low cardinality cannot be demonstrated |
| `too-many-distinct`    | a known estimate above the group-key ceiling                                                  |

A **dimension** with unavailable statistics is still groupable: refusing would
make grouping dead on a freshly restored database, and the result-size backstop
covers the risk. A **fact** is not, because a fact is a measure and guessing
"yes" on an amount column is the expensive direction. An **identifier** type
(`uuid`) is treated as a fact here despite being a dimension — a column of
opaque ids is usually a key, so it has to prove otherwise.

## What the emitted query carries, and why

`BuiltGroupQuery` is not just `{ text, values }`, and the extra fields are not
convenience. A grouped row is ambiguous on its own: under a rollup, a row whose
`shipping_country` is NULL is either a real NULL in the data or the subtotal
across every country, and the two are **textually identical**. Only
`GROUPING()` separates them.

So the builder ships the decoder with the data:

- `maskAlias` — the column holding `GROUPING(k₁, …, kₙ)`. **One variadic mask,
  not a flag per key**: fixed arity whatever the depth, one alias to defend
  instead of n, and the mask _is_ the grouping-set identity rather than
  something reassembled from flags.
- `keys` — ordered. Bit `n-1-i` belongs to `keys[i]`, so the mask cannot be
  decoded without them.
- `groupingSetMasks` — the mask of each emitted set, in emission order, for
  reconstructing the hierarchy without inferring it from the data.

Decoding, for key _i_ of _n_: bit set → the row is an aggregate over that key;
bit clear and the value NULL → a real NULL; otherwise a value.

## Ordering, and the `NULLS` keyword that must not appear

`GROUPING(key) <placement>, key <user>` per key in descriptor order, then any
aggregate sort. Two properties are worth stating because both are easy to break.

**The `GROUPING` term is emitted only when that key is rolled up in at least one
set.** One rule that degenerates correctly: a flat grouping never rolls anything
up, so its `ORDER BY` is byte-identical to `buildOrderByClause`'s.

**No `NULLS FIRST`/`NULLS LAST`, ever.** The `GROUPING` term partitions first:
where it is 1 the key is NULL on every row in the partition, so the term after
it orders nothing; where it is 0 the key is real data and a genuine NULL takes
Postgres's default placement, exactly as the ungrouped list view gives it. The
two kinds of NULL are never adjacent, so there is no placement to state — and
emitting one would break `../query-builder/build-keyset-comparison.util.ts`,
which deliberately depends on the default.

**Key terms always precede aggregate terms.** That is what makes "rank the
parents by their own totals" inexpressible rather than merely discouraged: an
aggregate sort can order leaves within a parent, never reorder the tree. Doing
it properly needs the parent's aggregate on the child row
(`sum(…) OVER (PARTITION BY k₁)`), which is a named v2.

## The guard rails, and the order they fire in

[ADR-066](../../../../../docs/decisions/ADR-066-grouping-guard-rails-and-per-query-timeout.md)
is the decision; four things about the implementation are easy to get wrong.

**Depth is checked twice, deliberately.** `assertGroupDepth` needs no capability
map, which is what lets `../select-grouped-rows.util.ts` run it before it borrows
a connection — a request at depth 9 must not cost a catalogue query. The builder
still runs it through `assertGroupKeys`, because the pre-flight check is an
earlier gate and never the only one.

**The catalogue's verdict beats the arithmetic one.** Both can fire for the same
request; "this column cannot be a group key" is actionable and "the product is
too large" is not, so `resolveGroupGuardRails` is called after
`assertGroupKeys`/`assertGroupAggregates`, never before.

**The estimate is summed over the emitted sets, not from a per-mode formula.**
`expandGroupingSets` is the same function the SQL is built from, so `flat`
(`∏dₖ`), `rollup` (`1 + Σᵢ ∏_{j≤i} dⱼ`) and cube (`∏(dₖ+1)`) all fall out of one
reduction. Adding a mode adds nothing here. One key with no estimate makes the
whole answer unknown — treating the missing factor as 1 would let the widest
column in the request be the one that hides the cost.

**Unknown statistics warn and proceed; the row limit is what makes that safe.**
`pg_stats` is empty for every table until something analyses it, so refusing
would make grouping look broken on every fresh restore. Instead the read runs
under a `LIMIT` of `MAX_GROUP_ROWS_WARN + 1`, and **reaching that limit is a
refusal**, not a truncation: a grouped result missing its tail is missing the
subtotals that belong to it, so it reads exactly like a correct one. A caller
whose own `maxRows` is tighter keeps its number and gets no backstop.

| Threshold               | Effect                                                                       |
| ----------------------- | ---------------------------------------------------------------------------- |
| `MAX_GROUP_ROWS_WARN`   | above it, a warning beside the rows; also the backstop `LIMIT` when unknown  |
| `MAX_GROUP_ROWS_REFUSE` | above it, refused — naming the widest group key, which is the actionable one |

`../../../../../apps/react-router/src/.server/groupingGuardRails.smoke.test.ts`
is the live-Postgres proof for the rails whose behaviour a mocked suite reports
green either way — the statement timeout firing, and the pool default surviving
on the same pooled connection.
