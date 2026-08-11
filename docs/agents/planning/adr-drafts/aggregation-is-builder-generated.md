# Aggregation is builder-generated in a sibling module, over `GROUPING SETS`

**Status:** Proposed

<!-- Draft — no number until adoption (see README.md). Home at adoption:
     docs/decisions/ — it governs a published package's public surface. -->

## Context

`packages/server/src/db/query-builder/` is a set of pure functions that assemble
parameterized SQL over raw `pg`, with no ORM. Its `ARCHITECTURE.md` states the
module's non-goals: **no joins, no subqueries, no raw SQL fragments**. Separately,
`docs/cqms/PRD.md` states that rollup belongs in Postgres **views**.

Row grouping needs `GROUP BY`, aggregates, and — for a count of groups — a
subquery. Today the tree has none of it: no `GROUP BY`, `ROLLUP`, `CUBE`,
`GROUPING` or `HAVING` generation exists anywhere in the builder. The only
aggregates are two hardcoded strings in `buildCountQuery` and
`buildMaxValueQuery`.

One correction to how the constraint is usually stated: the sibling's
`ARCHITECTURE.md` does **not** contain a blanket prohibition on aggregates — it
steers single-scalar aggregates towards being hand-written. So what needs
qualifying is the **subquery** rule and the PRD's views statement, not an
aggregate rule that was never written.

`build-select-query.util.ts` assembles a fixed **four-part** join
(`SELECT…FROM` / `WHERE` / `ORDER BY` / pagination) with no slot for a `GROUP BY`
clause between them.

## Problem

Grouping has two modes: consumer-declared presets, and runtime group-by where the
user chooses the keys. **A view cannot express the second one** — the keys are not
known until the request arrives — so the PRD's "rollup lives in views" answer is
unavailable for the feature's whole reason to exist.

Extending the flat builder to carry `GROUP BY` would put an optional clause and
an alias-collision surface into the function every non-grouped read on every route
already goes through, and would break its four-part assembly for the benefit of
one caller.

Underneath that sits a smaller choice with a large blast radius: whether to emit
`ROLLUP(a,b)` and `CUBE(a,b)` as Postgres's own sugar, or to expand them in
TypeScript into explicit `GROUPING SETS`.

## Options considered

1. **Extend `build-select-query.util.ts`.** Rejected: an optional clause on the
   hot path for one caller, and the four-part assembly is what makes that function
   readable.
2. **A sibling module that emits the sugar (`ROLLUP`/`CUBE`) directly.** Shorter
   query text, but three emission paths, and the cardinality guard must re-expand
   the sets regardless to count them — two representations that can drift.
3. **A sibling module that always emits expanded `GROUPING SETS`. `Chosen.`**
4. **Materialized views per grouping shape.** Rejected: combinatorial in the keys,
   and unavailable for runtime-chosen keys, which is the feature.

## Decision

Aggregation is **builder-generated**, in a new module named `group-query-builder`
created as a sibling of `packages/server/src/db/query-builder/`, which:

- **inherits the sibling's discipline** — pure functions, one export per file with
  a colocated test, never imports `getPool`, so its whole suite runs DB-free and
  lands in the `test:ci` lane that has no database;
- **permits what the sibling forbids, narrowly** — aggregates, and exactly one
  subquery (the opt-in count-of-groups query). Joins and raw fragments remain
  forbidden here too;
- **always emits `GROUP BY GROUPING SETS (…)`**, expanding rollup to n+1 sets and
  cube to 2ⁿ in TypeScript, in Postgres's canonical order;
- **reuses the identifier defences unchanged** — the safe-identifier pattern, the
  allowlist assertion and `quoteIdentifier` — and threads every value through the
  same immutable clause accumulator, so values remain `$n` without exception.

`allowedColumns` is **required** on the grouped descriptor, unlike the flat one
where it is opt-in: every group key is request-derived by construction, so opt-in
semantics would be a silent hole.

## Consequences

**What this buys.** Expansion costs nothing at execution — the planner normalizes
`ROLLUP`, `CUBE` and explicit `GROUPING SETS` into the same `MixedAggregate` node.
One emission path means simple, rollup and cube share one snapshot-test shape; the
guard rails get the expanded set list they need anyway; and expansion is a pure
array function testable with **zero SQL**.

**What this costs.** Query text is verbose — cube at depth 3 is 8 explicit sets.
That is legible in a snapshot test and invisible to users, and the depth cap keeps
it bounded.

More seriously, this **splits the SQL-emitting surface in two**. A future change
to identifier quoting or parameter threading must be applied in both modules or
they diverge — the sibling relationship is a convention, not a mechanism. The
mitigation is that the shared primitives are _imported_, not copied; only the
assembly differs.

Two traps the module must handle that the flat builder never faces. Postgres
**truncates identifiers at 63 bytes with only a `NOTICE`**, after which the driver
returns one row object where the second of two colliding aliases silently
overwrites the first — so alias uniqueness must be asserted on the _truncated_
form, and the repo's safe-identifier pattern has no length bound to lean on. And
because an aggregate may carry `FILTER (WHERE …)`, the `SELECT` list claims the
leading parameter positions and `WHERE` starts later — a departure from the flat
builder, though **not** unprecedented: `build-update-query.util.ts` already does
exactly this, which is why `buildWhereClause` takes a start index at all.

`packages/server`'s public surface grows. New subpaths must land in **both**
`exports` and `publishConfig.exports`, and the API-surface gate requires a
changeset. Export deliberately — only 9 of the sibling's 20 files are exported.

## Alternatives considered

**Rejected on evidence: emitting `ROLLUP`/`CUBE` sugar.** The reason to prefer
sugar would be better planning. Probed: bidirectional `EXCEPT ALL` between
`ROLLUP(a,b)` and `GROUPING SETS ((a,b),(a),())` returned **0 differing rows**,
same for `CUBE(a,b)` against its four sets; and `EXPLAIN (costs off)` returned
**byte-identical** `MixedAggregate` nodes with the same hash keys for both pairs.
The alternative hypothesis would have shown different output. It did not.

**Rejected: `HAVING` in v1.** Nothing upstream produces it — no filter variant can
express an aggregate predicate — and it fights the guard rails, since it reduces
rows returned but not work done, so a user "fixing" a refused query with one sees
it refused again. Under grouping sets it also applies per-set, dropping subtotals
while leaving orphaned detail rows: a hierarchy with holes.

## References

- `docs/agents/planning/table-row-grouping-plan.md` §1.4, §2.3, §4
- `packages/server/src/db/query-builder/ARCHITECTURE.md` — the non-goals this qualifies
- `docs/cqms/PRD.md` — the "rollup belongs in views" statement this qualifies
- Backlog entries P-02 (this ADR), P-13 (the builder), P-23 (the guard rails)
