---
governs:
  - server
---

# ADR-123 — A grouped read can put a dimension on the column axis with FILTER aggregates

**Status:** Accepted

**Issue:** [#1164](https://github.com/luciocabrera/lcabrera-stack/issues/1164)

**Extends**
[ADR-059](./ADR-059-aggregation-is-builder-generated.md) — the same builder emits
the wide form, by expanding aggregates rather than by adding a second SQL dialect.

**Narrows**
[ADR-066](./ADR-066-grouping-guard-rails-and-per-query-timeout.md) — the row
rails still bound height. Width is a separate, caller-supplied ceiling.

## Context

A grouped read already puts dimensions on the row axis. A pivot is the same
aggregation with one dimension rotated: unique values of that column become
headers, and each measure sits at a row × value intersection.

Postgres has no `PIVOT` keyword. The documented equivalent is
`agg(measure) FILTER (WHERE axis = $n)` with `GROUP BY` the remaining keys. The
builder already emits `FILTER (WHERE …)` for aggregate filters. Cube emission
stays **long** on purpose — one row per grouping-set combination — so a later
projection is not a rewrite. That long form is the wrong transport for a wide
grid: the coordinates have to become columns before the payload leaves the
server.

Two other constraints were settled with the work, not after it:

1. Any ceiling on distinct axis values comes from **config the caller passes**,
   not from a number the package invents.
2. If the query runs, the result is returned in full. Painting a wide grid is a
   later, windowed-render problem, not a reason to refuse a successful read.

## Options considered

1. **Re-project cube's long output in the OLAP seam.** Rejected as the default.
   Cube of two dimensions still returns on the order of (rows × values) long
   rows, then throws most of them away to build the matrix. The FILTER form
   asks Postgres for the matrix directly. Cube stays available for the lattice
   it already emits.

2. **Emit `FILTER` aggregates, one per distinct value, from `buildGroupQuery`.**
   Chosen. The distinct list is discovered by the executor in the same
   transaction as the grouped read. Aliases are `${measure}_c${index}` because
   axis values are not safe identifiers. The value travels beside the alias in
   the result, not in the SQL name.

3. **A package-constant cap of a few dozen columns.** Rejected. A process
   default belongs in env (`DB_PIVOT_MAX_DISTINCT`); a per-read ceiling belongs
   on the descriptor as required `maxDistinct`. Postgres's 1600-attribute heap
   limit (`MaxHeapAttributeNumber`) is a protocol fact and is checked as such,
   not as a product opinion. A result tuple may hold 1664 attributes; 1600 is
   the conservative bound so a projection never exceeds either.

## Decision

`GroupQueryDescriptor` takes an optional `columnAxis: { key, maxDistinct, values }`.
The executor fills `values` from a capped `SELECT DISTINCT` of `key`, using the
same filters as the grouped read and keeping NULLs. `buildGroupQuery` expands
each requested aggregate across those values into `FILTER (WHERE key = $n)`
(or `IS NULL`), groups only the row keys, and returns the alias → value map
beside the rows.

`maxDistinct` is required whenever a column axis is requested. The env helper
`readPivotMaxDistinct` is how an application supplies the process default. The
builder does not substitute a number when the field is missing — that is a type
error.

A distinct set past `maxDistinct` is `GroupingRefusedError` with reason
`column-axis-too-wide`, naming the axis column. A projection that would exceed
Postgres's heap-attribute limit is the same reason. Statistics-unavailable
does **not** warn-and-proceed on the axis: the capped distinct is what answers
width. An empty distinct set still reports the axis and emits no `FILTER`
columns. `maxDistinct` is checked before the discovery query, so a zero or
non-integer ceiling never becomes `LIMIT`. The axis key is checked against
the catalogue (not also a row key, groupable) before DISTINCT, so an illegal
axis is a grouping refusal rather than a driver error. A `countDistinct`
that expansion would emit more than once is `aggregate-not-legal`.

A read without `columnAxis` is unchanged.

## Consequences

The public grouped-read contract grows a field and a refusal reason. Cube SQL
does not change. The grid still has to window columns before a large successful
result is pleasant to scroll; that work is not this decision.

Period truncation on the axis key is not admitted here. A date axis is the raw
column until a later decision reuses `periods` for it.
