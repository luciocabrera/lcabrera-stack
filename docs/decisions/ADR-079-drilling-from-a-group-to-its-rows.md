# ADR-079 — A group drills to one bounded page of its rows, and hands off for the rest

- **Status:** Superseded by [ADR-087](./ADR-087-a-group-opens-its-rows-in-a-route.md)

> **Superseded 2026-08-24 (#870).** The body below is left exactly as written — a
> dated record of what was true at the time. A group's rows now open in a modal
> **route** rather than being spliced underneath the group row: the inline drill,
> its bounded page, its hand-off row, its per-group fetch state and the
> `/_api/enterprise-orders/drill` endpoint are all gone, and `onDrillGroup` /
> `isGroupDrillEnabled` have left `@lcabrera/ui`'s public surface. What survives
> untouched is `toDrillRead` and the four correctness rules it owns — ADR-087
> changes who calls it, not what it does. See ADR-087 for why the parallel row
> lifecycle this decision introduced was the cost that outweighed the benefit.

- **Date:** 2026-08-18
- **Amended:** 2026-08-19 (#777) — the primary decision is unchanged; the per-group fetch state gains a **fourth** member, `failed`, because the three named below cannot express a drill that was asked for and did not arrive. See [Amendments](#amendments).
- **Scope:** `@lcabrera/ui` — `src/components/Table/` group rows and expansion; `@lcabrera/server` — the paginated read a drill reuses
- **Issue:** #772 — constrains its children; parent epic #547
- **Related:** [ADR-059](./ADR-059-aggregation-is-builder-generated.md) (a grouped read returns whole), [ADR-061](./ADR-061-grouping-config-in-url-expansion-in-store.md) (grouping config is URL state, expansion is client state), [ADR-065](./ADR-065-grouped-rows-render-a-hierarchy-column.md) (what a group row renders), [ADR-067](./ADR-067-expansion-is-the-collapsed-set-and-a-group-row-is-a-tree-node.md) (expansion is the collapsed set), [ADR-052](./ADR-052-keyset-pagination-for-infinite-scroll.md) (the keyset cursor a drill reuses), [ADR-066](./ADR-066-grouping-guard-rails-and-per-query-timeout.md) (what bounds a grouped read)

## Context

The grid groups, aggregates, rolls up and expands. What it cannot do is show the
rows a group is made of.

A grouped read projects only the group keys and their aggregates (ADR-059), so
`selectGroupedOrders` returns `rows.map(toOrderGroupRow)` with `hasMore: false`
and nothing else. Expansion therefore moves between **levels of summary** —
category, then subcategory — and the orders themselves are unreachable from the
grouped view. A user who groups by category to find where the money went, and
then wants the orders in one category, has to clear the grouping and rebuild the
same restriction as filters, losing the totals that made them look.

Two things make this cheaper than it first appears, and one makes it dearer.

**The rendering is nearly free.** `TableBodyRows` already renders group rows and
detail rows through one path over one cell grid; `buildTableBodyCellDescriptor`
already blanks a detail row's grouped-by columns; `getTableGroupRowSummary` asks
the **row** what it is rather than asking the grouping configuration — which is
precisely what lets a group row and a detail row arrive in one result.
`TableGroupRowSummary`'s own documentation anticipated this: _"so a grouped row
and a detail row can sit in the same result — which is what the nested rows in a
later slice need."_

**The query is not a new kind of query.** `selectOrdersPage` already serves the
ungrouped table with keyset pagination, filters and sort (ADR-052). A drill is
that same call with the expanded group's key values appended to its filters. A
group _is_ a restriction; it has always been one.

**What is dear is the scroll.** Paging within a group is infinite scroll inside
a bounded region of the table, and the grid's prefetch is written for one
sequence that ends at the bottom. Two groups open at once means two independent
cursors live in the same scroll container, over a row array whose length changes
in the middle. Nothing in this codebase does that.

## Problem

A blocker that has to be cleared before anything else matters, then the costs
the decision has to price. The scroll cost is the fourth and it is stated in
Context above, because it is what narrows the field rather than what the
decision pays for.

**The blocker: a group path carries labels, not values.**
`TableGroupKeyValue` is `{ columnKey, label }`, and `label` is the value
**formatted** — `toOrderGroupLabel` renders a NULL key as `(empty)`, a date as
an ISO string, a boolean as `'true'`. So the path cannot be turned into filters
as it stands: `category = '(empty)'` matches nothing, and the one group a user is
most likely to be puzzled by is exactly the one that silently returns empty.
This is the same failure #765 fixed on the aggregate side, where a rendered
string stood in for a value and a `numeric` sum reached a currency column as
`"302540833.38"`.

**Filter inheritance is the correctness criterion, and it fails quietly.** A
drilled read that does not carry the grouped view's filters returns rows that
are true facts about the table and wrong under the heading they appear beneath —
a group stating 214 orders with 1,008 rows under it, dated outside the filter
the user set. Both render; neither throws; every number is individually correct.
An error that produces plausible rows is worse than one that produces none.

**Not every group row has rows beneath it.** Under a rollup a subtotal sits
_below_ the levels it totals and is not the parent of any detail; only the
innermost grouping set has rows directly underneath. "Can this row drill" is
therefore not a property of being a group row.

**The result contract says the page is complete.** The grouped branch declares
`hasMore: false` because a grouped read is not paginated. Rows arriving after
expansion contradict that, and they change the length of the array `TableBody`
sizes `<tbody>` from and the focus store indexes into.

## Options considered

1. **No drill. A group row action navigates to the ungrouped table,
   pre-filtered to that group.** Rejected as the whole answer — see
   [Alternatives considered](#alternatives-considered) — but retained as half of
   it.
2. **Full drill: expand a group and page through all of its rows in place.**
   Rejected. It buys the last mile — scrolling to row 214 without leaving the
   grouped view — at the price of the one mechanism with no precedent here:
   concurrent per-group cursors in a shared scroll container, each mutating the
   middle of the row array the virtualizer measures. The height invariant, the
   focus index space and the prefetch trigger all become functions of which
   groups happen to be open. That is a large, novel surface for a case a user
   reaches only after deciding they want the whole group.
3. **Drill to one bounded page, and hand off for the rest. `Chosen.`**

## Decision

**Expanding the innermost group of a grouped grid fetches one bounded page of
that group's rows and splices it under the group. It never fetches a second
page. Where the group holds more rows than the page, the last row of the drill
is a hand-off that opens the ungrouped table pre-filtered to that group.**

### Which rows drill

Only a group row whose `path` is a **complete** grouping set — one entry per
applied group key — and which is not a subtotal. A subtotal never drills: its
children are the levels it totals, not rows. A grand total never drills. The
rule is stated over the row's own path, never over the grouping configuration,
consistent with how the table decides everything else about a row (ADR-067).

### The path carries values

`TableGroupKeyValue` gains `readonly value: unknown` beside its `label`. The
label stays and stays formatted — it is what the hierarchy column renders, and
formatting a key still needs a `dataType` the row does not carry. The value is
what a drill translates into a filter. This mirrors `TableGroupAggregateValue`
after #765: the display string and the datum are two fields because they answer
two questions, and collapsing them is what broke both.

### What a drill queries

The filters of a drilled read are, in order:

1. **every filter the grouped view was read under**, unchanged; then
2. **one equality per path entry** — `{ column: columnKey, operator: 'eq', value }`
   — and an `IS NULL` rather than an equality where the value is null, because
   SQL equality against NULL is never true and a real NULL group would otherwise
   return nothing.

Its sort is the view's sort **minus the group-key terms**, which are constant
within a group and order nothing, followed by the route's own tiebreaker so the
page is deterministic
([ADR-008](../../apps/react-router/docs/decisions/ADR-008-primary-key-sort-tiebreaker.md)).
Its limit is the route's page size, clamped by the same ceiling every read of
that table is clamped by.

### What the response contract says

The grouped response keeps `hasMore: false`. It is telling the truth: the
grouped result is complete, and drilled rows are a **different read** whose
arrival says nothing about it. Per-group fetch state lives beside the collapsed
set in the expansion store — `idle | loading | loaded` — and three states
suffice precisely because there is no fourth: `loaded` is terminal, since a
drill never pages again.

> **Amended 2026-08-19 (#777).** The count is wrong, and the reasoning it rests
> on is about the wrong axis. `loaded` being terminal rules out a _fifth_ state
> for paging; it says nothing about a fetch that fails. A fourth member,
> `failed`, is added — see [Amendments](#amendments).

### What the user sees when there is more

The group already knows its own row count (`summary.count`). Where that exceeds
the page fetched, the drill's last row states the shortfall and offers the
hand-off — one row, at the row height every other row paints at. The hand-off
navigates to the same table with grouping cleared and the drill's filters
applied, which is a URL this route can already express.

## Consequences

**You cannot scroll to the 214th row of a group inside the grouped view.** That
is the cost, and it is deliberate rather than a first slice waiting to be
finished: the hand-off exists so that nobody has to build the two-cursor case to
answer the question. If a later ADR admits full in-place paging, it supersedes
this one; it does not extend it.

**A drilled page is a snapshot, not a live window.** It is fetched once when the
group opens. A filter change re-reads the grouped view and discards drills with
it, which is the lifetime the collapsed set already has (ADR-067) — but a drill
that is stale relative to concurrent writes will not correct itself, where the
ungrouped table's scroll would.

**`TableGroupKeyValue` gains a field, and that is a published surface change.**
Every consumer building a `TableGroupRowSummary` supplies it; under 0.x that is
a `minor` with a changeset and a regenerated `api-surface` snapshot. Routes that
never drill still supply it, which is the price of one shape rather than two.

**Filter inheritance has to be proven against a live database**, not a fixture.
A mocked result cannot show a drill drawn from the wrong scope: the mock returns
whatever it was told to. This is the one criterion in #772's children that a
unit test cannot discharge.

**The row array now changes length from two directions** — a collapse removing
rows, and a drill adding them. Both go through the same derivation and the
height identity `TableBody` asserts is over `rows.length`, so the invariant
holds by construction; but it is load-bearing in a second scenario now, and the
grouped body's height test should cover a drilled state.

## Alternatives considered

**Navigate to the pre-filtered table instead of drilling at all.** Rejected as
the complete answer, and adopted as the overflow path. It answers "which orders
are in here?" at nearly zero cost — reusing filter state that exists, changing
no contract, adding no fetch state, leaving the virtualizer alone. What it gives
up is context: the rows and the subtotal they roll into are never on screen
together, and two groups can never be compared row by row. Sending the user to
another view to answer a question they asked _of this view_ is a real loss, and
the bounded drill buys it back for the common case of "show me a few".

**Fetch every row of a group in one unbounded read.** Rejected: it removes the
cursor problem by removing the bound, and a group can hold a large fraction of
the table. The guard rails that bound a grouped read (ADR-066) exist for exactly
this reason and would be contradicted by an unbounded drill beside them.

**Reuse the grouped read by adding detail rows to its projection.** Rejected: a
`GROUP BY` result and its input rows have different shapes and different
cardinalities, and a single statement returning both is a union whose row count
is unbounded by the grouping. It also re-couples the two reads, where keeping
them separate is what lets a drill inherit ADR-052's pagination unchanged.

**Derive "can drill" from the grouping configuration** — path length equals the
number of applied keys. Rejected: the table never asks the configuration what a
row is (ADR-067), because the configuration and the rows it produced can differ
for a render. The row's own path is the authority, and asking it costs the same.

## Amendments

**2026-08-19 — a drill can fail, and three states cannot say so (#777).** The
primary decision is unchanged: one bounded page, spliced under its group, no
second page, a hand-off for the rest. What changes is the fetch state that
carries it.

### What the original said, and why it was wrong

The decision named `idle | loading | loaded` and justified the count directly:
_"three states suffice precisely because there is no fourth: `loaded` is
terminal, since a drill never pages again."_

That argument is sound and answers a different question. `loaded` being terminal
rules out a state for **paging further** — the drill equivalent of
`isLoadingMore`, which this decision deliberately does not have. It says nothing
about a request that was issued and did not come back. The two are independent
axes, and the sentence collapsed them.

The gap is not hypothetical. A drilled read is a network request against a
route that can answer 400 — this decision gives it three distinct refusals of
its own, `grand-total`, `subtotal` and `incomplete-path` — and a query that
`ADR-066`'s per-query timeout can cut off. Every one of those outcomes has to
land somewhere.

### Why the three states cannot absorb it

Each of them makes a claim that is false after a failure, and each is worse than
the last:

- **`loading`** — the row keeps a spinner that will never resolve, at the row
  height every row paints at. The most visible failure and the least
  recoverable: the affordance is spent and the group is stuck.
- **`loaded`** with no rows — states that the group has no rows, which
  contradicts the `summary.count` printed in the same row. Two numbers on one
  screen disagreeing, with nothing saying which is wrong.
- **Back to `idle`** (no entry) — the chevron returns to collapsed and nothing
  else changes. After a spinner this reads as "the click did nothing", so the
  user's next move is to click again, which is the same failing request. A
  retry loop the interface invited.

The third is the one to be explicit about, because it is what an implementation
reaches for when the state model has no room: it is not a safe default, it is a
silent failure with a retry built in.

### The decision

**A fourth member, `failed`, is added to the per-group fetch state.**

- It is entered when the drilled read does not produce a page, whatever the
  reason. The reason is **not** carried in the state: a refusal and a timeout
  differ to the server and not to the reader of one group row, and a state that
  fans out per cause is one every renderer has to exhaust.
- The group stays **expanded** in it. Collapsing on failure would erase the only
  evidence that anything happened.
- It renders at the same `rowHeight` as every other row, which is the invariant
  this whole path is held to — a failure state is not exempt from the identity
  `<tbody>` is sized by.
- It is **not terminal**. Toggling the group re-enters `loading`, which is the
  retry, made explicit and asked for rather than inferred from a click on a
  control that appeared to do nothing.

`loaded` stays terminal, and the original reasoning for that is untouched: a
drill still never pages again, and the answer where a group holds more rows than
the page is still the hand-off row.

### What this does not open

It does not admit a per-cause state, a retry counter, or an automatic retry. A
failed drill is one state that a deliberate gesture leaves. Anything that
retries on the user's behalf turns a bounded read into an unbounded one, which
is the property this decision exists to keep.

## References

- #772 — the issue this decides; #547 — the epic
- #765 / [PR #766](https://github.com/luciocabrera/vite-react-compiler/pull/766)
  — the aggregate `label` → `value` change this repeats for keys, and why
- #771 / [PR #773](https://github.com/luciocabrera/vite-react-compiler/pull/773)
  — the pointer expansion a drill is triggered from
- `packages/ui/src/components/Table/Table.types.ts` — `TableGroupKeyValue`,
  `TableGroupRowSummary`
- `apps/react-router/src/routes/enterprise-orders/.server/enterpriseOrders.service.ts`
  — the grouped branch, and `selectOrdersPage` the drill reuses
