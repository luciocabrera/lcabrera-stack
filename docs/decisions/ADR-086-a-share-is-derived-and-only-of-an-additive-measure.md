# ADR-086 — A share of the total is derived from the rows, and offered only on an additive measure

- **Status:** Accepted
- **Date:** 2026-08-20
- **Scope:** `@lcabrera/ui` — the share selection, its denominator and its rendering
- **Issue:** #648 — share-of-total measure and its proportional bar
- **Narrows:** [ADR-059](./ADR-059-aggregation-is-builder-generated.md) — records why a share is **not** added to the builder's aggregate vocabulary
- **Related:** [ADR-058](./ADR-058-grouping-legality-by-analytical-role.md) (the legality question a share asks differently), [ADR-061](./ADR-061-grouping-config-in-url-expansion-in-store.md) (the URL the selection travels in), [ADR-065](./ADR-065-grouped-rows-render-a-hierarchy-column.md) (the grand total it divides by), [ADR-080](./ADR-080-a-group-key-renders-in-its-own-column.md) (why it is not a column of its own)

## Context

A share of the total is the one derived measure a grouped grid is expected to
have and this one did not. It is different in kind from every aggregate in the
vocabulary: `sum`, `count`, `avg` and the rest are folds over a group's own
rows, where a share is a **ratio between two rows**, one of which the group does
not contain.

#648 asks three questions to be answered before any code — the denominator,
where it is computed, and whether it lies. A fourth turned up while measuring,
and it is the one that constrains the feature.

## Decision

### 1. The denominator is the grand total

Share-of-parent is the other useful reading and it is not built. The two
disagree at every level below the first and compose differently — parent-
relative shares sum to 100% within each parent, grand-total shares sum to 100%
across the leaves — so offering both without saying which is which would make
the number unreadable.

**It is named wherever it is read**, rather than left to be inferred: the
control is "Show share of grand total", and each cell's accessible text is
"12.3% of the grand total". This grid shows the same measure at several levels
at once, so position cannot carry which total a percentage is of.

### 2. It is derived on the client, from the rows the read returned

A grouped read is whole — ADR-059 gives it `hasMore: false` — so the client
provably holds every row the denominator is drawn from. Two rules, both exact:
under `rollup` the grand total **is** a row the server computed, identified by
`isSubtotal` with an empty path; under `flat` no such row exists and the
non-subtotal rows are summed instead.

The server route was considered and rejected on correctness before cost. Under
`GROUP BY GROUPING SETS` the obvious `sum(x) OVER ()` windows over the _result_
rows — which include every subtotal and the grand total — so it double-counts.
Getting it right needs a mask-filtered window, which is a new emission kind
outside ADR-059's aggregate vocabulary, to produce a number the client already
holds exactly.

**The precondition is written down because it is load-bearing.** If a grouped
read ever becomes paginated, this derivation stops being sound — and it will not
fail loudly, it will divide by a partial total and render a plausible wrong
number. `resolveShareDenominators` is where that assumption lives, and the live
suite pins the property it depends on rather than assuming it.

### 3. It is offered only on an additive measure

This is the constraint the issue did not anticipate, and it is a legality rule
rather than a rounding note. A derived denominator is only correct where adding
the parts gives the whole. Measured against the seeded fixture:

| measure                            | true grand total | summed across groups |
| ---------------------------------- | ---------------- | -------------------- |
| `sum(total_amount)`                | 21302893287.00   | 21302893287.00       |
| `avg(total_amount)`                | 21302.8933       | 20693.1712           |
| `count(DISTINCT shipping_country)` | 3                | 24                   |

`countDistinct` is why this is enforced rather than documented: a client summing
per-group distinct counts would divide by 24, and every share would still add up
to 100% while being wrong eightfold. That is the failure mode that reads as
correct.

So a share is offered on `sum` and `count` alone. `min`/`max` are excluded for a
different reason — they _are_ derivable across groups, but a share of a minimum
is not a quantity anyone means.

The rule is enforced at three depths, matching how every other grouping member
is treated: the control renders nothing where a share is undefined, the reducer
refuses to add one, and `sanitizeGroupingByColumns` refuses the **whole**
configuration arriving from a URL (ADR-061) — because a link promising a
percentage column would otherwise open a table whose percentages were wrong
rather than merely absent.

### 4. It renders inside the measure's own cell, not in a column of its own

The reference designs show a `% OF TOTAL` column. This grid cannot have one
without undoing [ADR-080](./ADR-080-a-group-key-renders-in-its-own-column.md),
which removed column injection outright — "No column is added — a group row
states each key's value in that key's own column". Reintroducing a derived
column for this would take back that decision for a presentational reason.

So the share renders beside the number it is a share of, in
`TableGroupAggregate`. That placement also settles the third question: **a share
divides a filtered measure by a filtered total**, and that cell already renders
`TABLE_GROUP_FILTERED_AGGREGATE_LABEL` when its column carries a filter, so the
obligation #570 established is inherited rather than restated.

## Consequences

A share is a display of state the query already produced, so turning one on
changes no SQL and costs no round trip. It travels in the `grouping` URL param
with the rest of the configuration, so a shared link opens showing what its
author saw.

**The denominator is derived once per data set and cached weakly on the rows
array.** That is not a later optimisation: the fold is over every row, a grouped
read is capped in the thousands of them, and every measure cell asks — so
recomputing per cell is quadratic where this is linear.

An absent or zero denominator renders an explicit absence, never `0.0%` and
never `NaN`. Each refusal is a separate branch because each would otherwise
produce a number that formats: `x / undefined` is `NaN`, `x / 0` is `Infinity`,
and both pass a `typeof === 'number'` check.

**The bar is decorative.** It is `aria-hidden` with no `role`, because it
depicts a value that is already text beside it; a `progressbar` would announce
the quantity twice and imply a task in progress. Its width is a StyleX **dynamic
style** rather than an inline one, so the per-render value becomes a custom
property and no `style` attribute stands in the way of a strict CSP (ADR-005).

**What is not built:** share of the immediate parent, and any other derived
measure — running totals, period-over-period, rank. The mechanism here is
specific to a ratio against one denominator drawn from the same result; it is
not a general derived-measure framework and should not be extended into one
without its own decision.
