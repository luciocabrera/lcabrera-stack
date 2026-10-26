---
governs:
  - server
---

# ADR-143 — Join only along a foreign key, and filter a grouped result only when it is flat

**Status:** Proposed. This records the decision for the package owner to
approve. Nothing it describes is built yet. `What this does NOT do` in
`packages/server/src/db/query-builder/ARCHITECTURE.md` lists what is true today,
and the change that builds a feature also removes it from that list.

**Date:** 2026-10-26

**Issue:** [#998](https://github.com/luciocabrera/lcabrera-stack/issues/998)

## Context

`buildReadQuery` ([ADR-140](ADR-140-build-every-read-through-one-entry-point.md))
is the one entry point for a read in `@lcabrera/server`. It reads one target,
a table or a view. A read that spans two tables has two ways to go today, and
both leave the builder: a database view that encodes the join, or hand-written
SQL run through `getPool`. A view needs someone with DDL rights to create and
keep it. Hand-written SQL gives up every guarantee the builder makes.

A grouped read can filter **inside** an aggregate. `GroupAggregate.filters`
emits `count(*) FILTER (WHERE …)`, which narrows the rows one aggregate counts.
It cannot filter the **groups**: "only the groups whose sum is above a
threshold" is a `HAVING` clause, and the builder emits none.

The safety of the builder rests on three things, and a join touches each of
them:

1. **Identifier syntax.** `assertSafeIdentifier` checks every schema, table and
   column name against `^[a-z_][a-z0-9_]*$`, and `quoteIdentifier` quotes it.
   This is what makes an identifier injection-safe. It always runs.
2. **Value parameters.** Every value becomes a `$n` parameter. No value is ever
   written into the query text.
3. **Column authorization.** `allowedColumns` limits which columns a read may
   name. It is opt-in on a row or count read and required on a grouped read.
   It does not make anything injection-safe, since the first check already
   does that. What it does is stop a read from reaching a column that is valid
   SQL but was never meant to be exposed.

A join adds a second target. That raises three questions the single-table
builder never had to answer. Which tables can a read reach? Which columns of
each table can it name? And can the join multiply rows? Multiplying rows is
the classic join bug: a sum over a parent row joined to its child rows counts
the parent once per child.

## Options considered

1. **Keep the exclusion; views remain the only way to join.** This has the
   smallest surface, and a view really is a database-owned allowlist. Rejected
   because it leaves the gap where it is. A read over related tables still
   needs a migration, and the alternative is SQL that has none of the builder's
   checks. It also leaves the filter on a grouped result unanswered, and that
   filter needs no join at all.
2. **Free joins: the descriptor names any target and any `ON` condition.**
   Rejected. An `ON` clause made of caller expressions is a raw fragment by
   another name. A free target lets a read reach any table the connection can
   read. A free condition can build a one-to-many or cartesian join, and then
   every aggregate, count and page over the result is wrong without any error.
3. **Joins along a declared foreign key, many-to-one only, with an allowlist per
   joined table; a group filter on flat grouped reads.** Chosen.

## Decision

Both features go in through `buildReadQuery` and the descriptor it already
takes. No new builder and no new entry point are added.

### A join follows a foreign key from a table the read already reaches

- A join is named by the **referencing columns** on a source the read already
  reaches: the base target, or an earlier join. The join's target and its
  referenced columns are not written by the caller. They come from a
  **relation map** resolved from the catalogue (`pg_constraint`, `contype =
  'f'`). This works like the `capabilities` map a grouped read takes today. A
  pure builder refuses any join that the map does not hold. An executor
  resolves the map with one catalogue round trip, as `selectGroupedRows` does
  for capabilities.
- So **a read reaches only tables the schema itself declares related**. The
  descriptor cannot name any other target.
- Only the **many-to-one** direction is offered. A foreign key always
  references a primary key or a unique key, so each source row matches at most
  one target row. A join can add columns to a row but can never repeat the
  row. That one rule keeps the rest of the builder correct. A count over the
  join counts source rows. A keyset cursor that ends on a unique column of the
  base target stays a total order. An aggregate counts each source row once.
  The other direction (one row to many) is refused. "Parents whose children
  total more than X" is a grouped read on the child table, keyed by its
  foreign key and filtered on its aggregate.
- The join kind is `inner` or `left`. `left` keeps a source row whose foreign
  key is null. `right`, `full` and `cross` are not offered.
- The `ON` clause is written by the builder alone: one quoted equality per
  column pair of the foreign key. It carries no caller expression, no operator
  and no value.

### Every table a join reaches has its own allowlist, and it is required

- Each join carries an **alias** and its own `allowedColumns`. Once a read has a
  join, the base target's `allowedColumns` is required too, even on a row read
  where it is opt-in today. Reaching a second table is a decision about tables,
  not only about columns, so it cannot be left implicit.
- A column from a joined source is referenced as `{ column, source }`, where
  `source` is the join's alias. A bare string still means the base target.
  Every reference in `fields`, `filters`, `sort`, `cursor`, the grouped `keys`
  and `aggregates`, and the foreign-key columns a join is named by, is checked
  by `assertSafeIdentifier` and by `assertColumnAllowed` against **its own
  source's** list. A column that is allowed on one source is not allowed on
  another source under the same name.
- A projected joined column is aliased `"<alias>.<column>"`. A safe identifier
  cannot contain a dot, so this alias cannot collide with a base column or
  with another join's column, provided Postgres keeps the whole alias. It does
  not always: Postgres truncates any identifier longer than 63 bytes
  (`NAMEDATALEN - 1`), and two aliases that share their first 63 bytes would
  then come back under one name. So the builder **refuses** a join whose
  projected alias for any selected column is longer than 63 bytes, before it
  builds any SQL, and the error names the alias and the column. A safe
  identifier is ASCII, so its byte length is its character length and the
  check needs no encoding. The builder does not shorten the alias itself,
  because a shortened name would no longer be the `<alias>.<column>` a caller
  reads the row by. A caller that hits the limit picks a shorter join alias.
  Within the limit, two tables that both have an `id` column both come back.
- A grouped read over a join takes a `capabilities` entry per source.
  Capabilities and their distinct estimates are resolved per table. Because the
  join is many-to-one, a joined column's own distinct count is still an upper
  bound on the values it brings into the result, so the guard rails of
  [ADR-066](ADR-066-grouping-guard-rails-and-per-query-timeout.md) keep their
  meaning.

### A filter on a grouped result names an aggregate the read already declares

- A grouped descriptor gains `groupFilters`, a list of `{ aggregateAlias,
  operator, value }` entries, or `{ aggregateAlias, operator }` for the null
  tests. This mirrors `GroupSort`'s `aggregateAlias`. The alias has to resolve
  to an aggregate in the same descriptor's `aggregates`, and anything else is
  refused. The builder emits `HAVING <that aggregate's expression> <op> $n`.
  Postgres does not let `HAVING` name an output alias, so the expression is
  written again from the same `AGGREGATE_SQL` entry and its own `FILTER`, never
  from caller text. The operators are the `QueryFilter` ones, minus `ilike` and
  `notIlike`, which make no sense on an aggregate. The value is a parameter.
- `groupFilters` is accepted only with `grouping: 'flat'` and refused with
  `rollup` or `cube`. In a grouping-sets query `HAVING` tests every emitted row,
  subtotals included, and a subtotal is computed over **all** its children,
  not only the ones that pass. A grid would show a subtotal that does not add
  up to the rows under it, and nothing would report an error. Defining a
  filtered subtotal is a separate decision.

### What stays excluded

Subqueries, common table expressions, window functions, raw SQL fragments, and
any join other than the ones above. The write builders are not affected.

## Consequences

- A read over related tables needs no view and no hand-written SQL, and it
  keeps all three checks from the Context. The filter on a grouped result
  becomes expressible without a join.
- A row read with a join pays a catalogue round trip for its relation map. A
  grouped read already pays one for capabilities. An executor can resolve both
  in one query, but it is still one more query than a single-table row read
  needs.
- The base `allowedColumns` changes from opt-in to required **only for a read
  with a join**. A caller that adds its first join has to write a list it did
  not need before. That cost is on purpose.
- A column reference becomes `string | { column, source }` across `fields`,
  `filters`, `sort` and the grouped fields. The published type surface widens,
  and every function that reads a column name has to handle both forms. It is
  a minor bump while the package is `0.x`.
- A join alias and a column name that are each legal can still be refused
  together, because their projected alias exceeds 63 bytes. The caller learns
  this from an error at build time, not from a missing column at read time.
- A one-to-many question stays inexpressible as a join. Some readers will expect
  "each parent with its children" to be a join. Inverting it into a grouped read on
  the many side is something the caller has to know to do.
- A view is still the answer for a relation the schema does not declare as a
  foreign key, and for a join on anything other than key equality.
- The rollup and cube filter is left open. A grid that offers subtotals cannot
  offer a group filter until that decision is made.

## Alternatives considered

- **Have the caller declare uniqueness, as a keyset cursor's unique column is
  declared today.** Rejected. A wrong declaration on a cursor costs a skipped
  row. A wrong one on a join silently multiplies every aggregate. The catalogue
  already knows the answer, so the builder does not need to trust the caller.
- **A per-read table allowlist (`allowedTables`) instead of the foreign-key
  rule.** Rejected as the primary rule. It answers "which tables" but not "is
  this join many-to-one", and a correct join condition would still have to come
  from the caller. The per-join `allowedColumns` already does the work of a
  table allowlist: a source with no list cannot be read from.
- **A dotted string (`'alias.column'`) as the joined column reference.**
  Rejected. It changes what `assertSafeIdentifier` accepts, and the dot is the
  character that keeps the projected alias apart from every base column.
- **Derive a bounded alias when `<alias>.<column>` is too long**, for example
  by truncating it and appending a hash. Rejected. The row would come back
  under a name the caller cannot predict without calling the same function,
  and a truncated hash can still collide. Refusing the read keeps the alias
  equal to what the caller wrote.
- **Apply `HAVING` to every grouping set and document the subtotals.**
  Rejected for the reason given under the group filter: the result is wrong and
  raises no error.
- **Filter the leaf groups in a subquery and roll up the survivors.** This
  gives the subtotals a grid would expect. Deferred because it needs a subquery,
  which this decision keeps excluded. It is the likely shape for the follow-up
  on filtered subtotals.

## References

- [ADR-140](ADR-140-build-every-read-through-one-entry-point.md): the entry
  point both features extend
- [ADR-052](ADR-052-keyset-pagination-for-infinite-scroll.md): the total order a
  many-to-one join preserves
- [ADR-058](ADR-058-grouping-legality-by-analytical-role.md),
  [ADR-059](ADR-059-aggregation-is-builder-generated.md),
  [ADR-066](ADR-066-grouping-guard-rails-and-per-query-timeout.md): the grouped
  read the group filter extends
- `docs/product/requirements/express-a-join-and-an-aggregate-filter.md`
- `docs/product/requirements/sql-is-injection-safe-by-construction.md`
