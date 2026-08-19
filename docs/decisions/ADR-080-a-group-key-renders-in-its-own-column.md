# ADR-080 — A group key renders in its own column, and the grouped layout is derived rather than stored

- **Status:** Accepted
- **Date:** 2026-08-18
- **Scope:** `@lcabrera/ui` — `src/components/Table/` grouped rendering, the column view-state derivation, and the grouping search param
- **Issue:** #789 — constrains #777, #648, #660; supersedes part of #647/#659
- **Supersedes:** [ADR-065](./ADR-065-grouped-rows-render-a-hierarchy-column.md)'s designated grid-owned hierarchy column, and its rejection of "reading B". Everything else ADR-065 decided stands — the shared cell grid, the em dash for an unrequested aggregate, the refusal to leak a uniform detail value onto a group row, the deleted banner, and blanking a grouped-by column on its detail rows.
- **Extends:** [ADR-061](./ADR-061-grouping-config-in-url-expansion-in-store.md) — the grouping param carries the report's layout overrides, not only its keys
- **Related:** [ADR-059](./ADR-059-aggregation-is-builder-generated.md) (what a grouped read returns), [ADR-058](./ADR-058-grouping-legality-by-analytical-role.md) (the aggregate menu a column offers), [ADR-062](./ADR-062-grid-semantics-roving-focus-and-row-identity.md) (roving focus and row identity), [ADR-079](./ADR-079-drilling-from-a-group-to-its-rows.md) (drilling from a group to its rows), [ADR-039](./ADR-039-duplicate-over-undeclared-edges.md) (why the grouping shapes are duplicated across packages)

## Context

ADR-065 gave a grouped grid a **grid-owned hierarchy column**: one synthetic,
left-pinned column carrying the group's label indented by depth, with every
other column rendering that group's aggregate in its own cell. It considered the
alternative — each group key's value rendered in that key's **own data column**,
which it named _reading B_ — and rejected it.

That rejection was sound on its premises and both premises have since moved.

**The first was about arrangement.** Reading B needs the group-key columns to sit
in key order with nothing between them, because "which column is filled" is the
whole depth signal. ADR-065 observed that column order, pinning and visibility
are per-browser layout persisted through the cookie while grouping lives in the
URL, so an ungrouped column can sit between two keys before anyone drags
anything; that `isStatic` freezes an arrangement but cannot create one; and that
making it safe would mean the grid seizing the user's column order — _"a drag is
a re-key, so a presentation gesture rewrites the `GROUP BY`"_.

**The second was about shape.** ADR-065 says of reading B: _"It is the flat
rollup-report form, and by the principle above it is the right rendering for a
lattice."_ When it was written the modes were `flat` and `rollup`, both trees.
Cube landed on the server under #574, and `TableGroupingMode` in `@lcabrera/ui`
still excludes it — the doc comment says why: _"its sets are not prefixes, so its
rows form a lattice rather than a tree and it renders flat rather than
indented."_ The UI is fenced off from a shipped server capability **by the
rendering**. The lattice ADR-065 named arrived.

## Problem

Four things the hierarchy column cannot do, three of them visible in the shipped
product.

- **A flat grouping renders no hierarchy at all.** `toGroupHierarchyLabel` takes
  `path.at(-1)` and indents by `path.length - 1`. In `flat` every row carries
  every key, so every row sits at the same depth and only the innermost value is
  drawn. Group by four keys and three of them appear nowhere on the row.
- **A rollup states a group's identity after its rows.** A subtotal is emitted
  _after_ the rows it totals, so a leaf label arrives before anything on screen
  has said which group it belongs to.
- **A cube cannot be rendered at all, and worse, renders wrongly if forced.**
  Its sets are not prefixes, so `path.length - 1` is not a depth and
  `path.at(-1)` does not identify a level. Two different grouping sets can
  produce byte-identical rows. A cube over two same-domain keys —
  `billing_country` and `shipping_country` — emits one row for _everything
  billed to Canada_ and another for _everything shipped to Canada_, and both
  render as `Canada total` at depth zero in the one column, with nothing
  separating them.
- **A key has no header of its own.** The synthetic column is `isSortable: false`
  and carries no filter, so sorting or filtering _by_ a group key has no
  in-grid home — while `assertGroupSort` and `buildGroupOrderByClause` already
  accept a per-key sort on the server.

There is also a cost nobody chose. The grid does not virtualize columns:
`useVirtualization` is called once, in `TableBody`, with `itemHeight` and
`totalItems`, and `TableBodyRows` maps its visible rows over the whole
`leftPinnedCols` / `centerCols` / `rightPinnedCols` partitions. So a synthetic
column is a real cell on every rendered row, and the key columns it duplicates
are still painted beside it.

## Options considered

1. **Keep the grid-owned hierarchy column.** Rejected: it is the thing the four
   problems above are properties of, and none of them is a matter of effort.
2. **One grid-owned column per group key** — the staircase, still synthetic.
   Solves the rendering problems and inherits ADR-065's argument for grid
   ownership unchanged. Rejected on two counts: it adds a column per key on
   every rendered row, and it still gives a key no header of its own, so
   sorting and filtering by a key remain homeless.
3. **The group key's own column carries its level — reading B. `Chosen.`**

## Decision

### The group key's own data column carries its level

A group row renders each key's value in that key's own column, and every other
column renders the selected aggregate or the em dash exactly as ADR-065 says. No
synthetic column exists; `createGroupHierarchyColumn` and the
`TABLE_GROUP_HIERARCHY_COLUMN_KEY` it produces are retired.

Depth is read from **which column is filled**, not from a pixel offset. That is
what makes the same rendering serve a tree and a lattice: a rollup fills a
prefix, a cube fills an arbitrary subset, and neither needs the other's reading.

### The arrangement is a derivation, and the hoist is what makes it safe

While grouping is applied, the group-key columns are moved to the head of
`columnOrder` **and** to the head of `columnPinning.left`, in key order, in the
same derivation that injects the synthetic column today.

**This is not the seizure ADR-065 rejected.** `withGroupHierarchyColumn` already
composes the grid's opinion on top of the user's without writing, and its own
doc comment states the guarantee: _"This is a derivation, never state. The store
keeps the consumer's `columns`, `columnOrder` and `columnPinning` exactly as they
arrived, so the synthetic key never reaches the cookie the layout persists
through."_ Generalising it from one synthetic column to N real ones inherits that
unchanged, so ungrouping restores the user's layout because the layout was never
modified.

**And the hoist alone is sufficient — the ladder cannot be broken.**
`getEffectiveColumns` filters by visibility, orders by `columnOrder`, then
returns left-pinned, centre, right-pinned; `splitColumnsByPinning` derives each
partition by filtering that already-ordered list. A key at the head of both
inputs therefore lands at index 0 of the painted grid, and N of them at 0…N-1,
ahead of anything the user pinned, whatever their saved order says. **No column
can sit between two group keys**, which is ADR-065's actual failure mode, and no
gesture can put one there. A drag never becomes a re-key because a drag never
moves a rung.

### Nothing is locked; two overrides are enough

Grouping does **not** take over column configuration. Hiding a non-key column,
pinning one, and resizing anything all stay available while grouping is applied.

Two overrides are required and no more:

- **A group key is forced visible.** Nothing forces this today, and a hidden key
  under reading B erases a level rather than merely hiding a column.
- **A group key is not draggable while grouped.** Not because a drag would break
  the ladder — the hoist prevents that — but because the hoist would undo it
  silently, and a gesture that visibly does nothing is worse than one refused.

A broader lock was considered and rejected on its own terms. Grouping a wide
table is precisely when a user most wants to put columns away. The grid does not
virtualize columns, so the rendered cell count is the declared column count times
the row window, and on a wide table hiding everything that is neither a key nor a
measure is a larger saving than any layout choice here moves. A lock on
visibility would forbid it, in the one configuration that needs it. The figures
behind that comparison are recorded on #789 rather than here, because they are
measurements and this is not their home.

**`isStatic` is the wrong instrument for the second override.**
`resolveColumnCapabilities` makes `isResizable` a veto of `isStatic`, and
`TableHeaderActionsMenu` computes `hasPinAndHide = !isStatic`, so marking a key
column static would also freeze its width and strip its header menu. Resizing a
rung cannot break a staircase. The refusal needs its own flag.

### An ancestor is carried, not repeated — with two requirements, not refinements

A key's cell is drawn when its value changes from the row above, and left blank
when it does not; a row's own innermost level always draws. Two behaviours are
part of this decision rather than polish, because without them carrying trades
one readability defect for a quieter one:

- **A carried cell refills at the top of the rendered window.** "Same as the row
  above" is derived from the loaded row array, never the painted one — and the
  first row of the window has no row above it on screen, so the block a reader is
  inside would be stated nowhere.
- **A carried cell carries visually-hidden text.** An empty cell announces as
  empty, so an ancestor that is only implied is not announced at all.

If either proves unworkable against the virtualizer, the fallback is to repeat
every level on every row. That costs noise and nothing else.

### An aggregate selected on a key column: the key wins

Nothing forbids selecting an aggregate on a column that is also a group key —
`assertGroupAggregates` checks each aggregate against the catalogue and never
cross-checks the key list. Under reading B that column cannot render both.

**The key's value wins and the aggregate is dropped**, and the aggregate picker
excludes columns that are currently group keys. The picker alone is not enough:
the grouping configuration is URL state, so a request can always ask for the
combination, and a rule that only exists in a menu is not a rule.

### The report's overrides travel in the URL, as intent

ADR-061 puts the grouping configuration in the URL because it is the query, and
column layout in the cookie because it is per-browser. Under this decision the
grouping param also carries the **layout overrides a grouped view implies** —
today a flag for "show only the keys and the selected measures", plus any
explicit override made while grouped.

**Why the URL rather than the cookie.** A grouped URL is shareable and reaches a
browser that never ran the interaction, so writing the layout at the moment of
grouping cannot cover the arrival: either the app writes the recipient's cookie
on arrival, and opening a link silently overwrites the layout they chose, or it
does not, and the URL and the layout disagree — which is the divergence writing
was for. Carrying it in the link resolves both, and ungrouping is dropping the
param, so the cookie layout reasserts itself with no snapshot to keep, invalidate
and get wrong.

**Intent, never a resolved layout.** The param carries what the derivation cannot
infer, not the answer the derivation produces. Serialising a whole column order
plus visibility, pinning and sizing scales with the table's width, and
`usePersistTableStateAction` already refuses a grouping change whose persistence
would be oversized — a limit this would spend on data the keys already imply.

**The cookie is never written while grouping is applied.** That is the property
that makes ungrouping free, and it is the one to test.

## Consequences

**The rendered cell count goes down, not up.** With the synthetic column retired
and no column added, a grouped row paints exactly the columns the consumer
declared. Against the alternative in option 2 that is N fewer cells per rendered
row; against the shipped hierarchy column it is one fewer.

**Cube becomes renderable, and `TableGroupingMode` can admit it.** That exclusion
exists because of the rendering, and the reason is now gone. Admitting it is
#574's follow-on, not this decision — what this decides is that nothing in the
rendering stands in the way.

**A group key keeps its header, so sorting and filtering by it have a home.**
The server already accepts a per-key sort. Wiring the header control is separate
work; the column that would carry it now exists.

**ADR-065's sub-decision 2 stops needing an argument.** It blanks a grouped-by
data column on its detail rows and notes that this only reads if the reader can
see which columns are group keys. With one column per key the group row states
the value and the rows it explains blank directly beneath it, in the same column
— which is also what a drilled group (ADR-079, #777) needs, without a rule of its
own.

**Three things must change together with the rendering.**
`Table.groupedGridSemantics.test.tsx` pins the gridcell count and the hierarchy
column's presence; `filterSettingsColumns` excludes the synthetic key and must
instead keep the key columns listed but locked; and `resolveGroupingColumnsPatch`
returns only derived members today — deliberately, per its own comment — and is
where the hoist lands.

**A layout gesture while grouped becomes a navigation.** A cookie write answers
204 and skips revalidation; a URL param re-runs the loader, and the loader
re-runs the grouped query. The drawer already stages into a draft and commits on
Accept, so that is one navigation per Accept; the header menu acts immediately.
This needs a `shouldRevalidate` that separates query params from presentation
params — `useSetTableGrouping`'s comment records that there is deliberately no
second one today.

**The horizontal budget is the price.** N key columns pinned left is real width
before the first measure, and it scales with `MAX_TABLE_GROUP_KEYS`. It is
accepted for the reason ADR-065 pinned its own column: a grouped grid is exactly
where a user scrolls right to reach measures, and a group row that detaches from
what it is a group of is worse than a narrower scroll region.

## Alternatives considered

**One grid-owned column per key (option 2).** Rejected under Options. Worth
recording that it is the _safer_ answer on ADR-065's own reasoning — a
grid-owned column's position is not the user's to hold an opinion about — and
that it was rejected on cost rather than on principle: a column per key on every
row, and a key still without a header.

**Grouping writes the column state.** Rejected: it cannot cover the arrival of a
shared grouped URL, and covering it means either overwriting the recipient's
saved layout or keeping a snapshot slice that must itself be persisted,
invalidated on every edit made while grouped, and reconciled when the column set
changes. The derivation covers both paths and keeps neither.

**A mode-dependent rendering** — the hierarchy column for `rollup`, the key
columns for `flat` and `cube`. Rejected for the reason ADR-065's own amendment
gives: a boundary that has to be re-argued per configuration is one that spreads.

**Repeating every level on every row** instead of carrying. Not rejected —
retained as the stated fallback if either carrying requirement proves unworkable.

## Amendments

**2026-08-19 — the fold control follows the drawn cell (#802).** The primary
decision is unchanged: one column per key, the value in its own column, ancestors
carried rather than restated. What this settles is the thing that decision moved
and did not re-home — **where the control that folds a level lives.**

### What was left behind

Putting the identity in the key columns left the chevron where the hierarchy
column had it: on whichever row `resolveTableGroupTree` reported as owning loaded
children. Under a rollup that is the **subtotal**, because a subtotal is emitted
_after_ the rows it totals (#570) and is therefore their tree parent. So the
label of a group appeared at the top of its block and the control for it sat at
the bottom — on a group longer than the viewport, off-screen entirely.

### The decision

**A group's fold control renders in the cell where that group's key is drawn.**
A row states its ancestors and does not own them, so those are the levels it
folds; the level it _does_ own is answered separately, below. `carriedGroupKeys`
is the only predicate — a carried cell renders no control, exactly as it renders
no label. No second notion of "first row of the group" is introduced, because
two predicates that must agree is how this drifted the first time.

**A row skips its own group only when it is a subtotal, and only while that group
is open.** The `isSubtotal` half is load-bearing and was found by breaking it:
every other group row _precedes_ what it owns, so folding itself from its own
cell already puts the control at the top, and a rule stated as "a row never folds
itself" takes the chevron away from an ordinary grouped grid entirely. The
`isCollapsed` half is what keeps a folded group reopenable — once it folds, every
row inside it is hidden and the subtotal is the only row left.

**A subtotal that offers no control renders the reserved box, empty** — the same
spacer any non-openable row has always drawn. Only some rows of a key column
offer a control, so a cell that dropped the box would sit a chevron's width off
from its siblings in the same column. No row's height changes; the box is inline.

### The tab-stop model, restated because it constrains this

ADR-062 gives the grid exactly one roving tab stop, addressed by row key plus
column key. **This amendment adds no tab stops and no ARIA.** The chevron is
`aria-hidden` and is not a button — unchanged from the original placement — so a
row that now draws three of them is still one cell-addressed stop per cell.

That is also the answer to the ambiguity a multi-control row would otherwise
create: **`aria-expanded` stays on the row and keeps describing the row's own
group only.** A row does not report its ancestors' states, because in a treegrid
`aria-expanded` means "this row's children are shown" and an ancestor's children
are not this row's. The ancestor chevrons are pointer affordances that the
accessibility tree does not see, and the keyboard reaches the same folds through
the cell it is already in: **`ArrowLeft`/`ArrowRight` act on the level the focused
column holds**. Without that the two paths would disagree on every row that
states an ancestor.

**A key column answers for itself and never falls back to the row**, which is
what makes that agreement exact rather than approximate. A key cell that
deliberately draws no control — an open subtotal in the level it totals — must
not fold from the keyboard either; falling back there would collapse the group
from the one cell whose blank space says it cannot. Nothing becomes unreachable:
the row that _does_ draw the chevron is in the same column one block up, and the
subtotal regains it the moment the group folds. The innermost key column of a
**drillable** leaf is the exception and is the drill, which by construction has no
level entry (ADR-079).

A column that is **not** a key column still falls back to the row, keeping the
treegrid pattern's row-scoped horizontal keys everywhere the question of _which_
level could not arise.

### Its interaction with the drill (#777), decided rather than discovered

One row can carry ancestor folds and, on its own innermost level, a drill. They
never compete for the same cell — a fold belongs to a level the row does not own,
a drill to the one it does — so the only question is a leaf whose drilled rows are
already spliced in, which owns loaded children _and_ is drillable. **The drill
answers there**, because it reports a group as open from the moment the fetch
starts rather than when its rows arrive (ADR-079); a fold derived from the
collapsed set alone would call it shut while its spinner showed.

### What this deliberately does not preserve

#802 asked for "exactly one row per group offers the control". That holds for the
ordinary case and **not** for the two restatements ADR-080 already specifies: the
virtualization window's first row refills carried levels, and a group row
following a drilled detail block refills them too. Both now restate the _control_
along with the label, and that is the intended reading rather than a concession —
a restated level whose chevron was suppressed would be an inert copy of a live
label elsewhere on screen. In the window-first case it is the point: it is what
keeps a control on screen for a group whose first row has been scrolled past,
which is the defect this amendment exists to fix.

## A note on reading this record

`docs:verify` does not gate code citations inside `decisions/`, by design: an ADR
naming a path records what existed when the decision was made. Every path,
comment and behaviour cited above was checked by hand against the tree on the
date in the header, and a later reader has to do the same rather than infer from
a green pipeline that the citations still hold.

## References

- [ADR-065](./ADR-065-grouped-rows-render-a-hierarchy-column.md) — the decision this supersedes in part, and whose reasoning it rests on
- [ADR-061](./ADR-061-grouping-config-in-url-expansion-in-store.md) — the state channels this extends
- [ADR-079](./ADR-079-drilling-from-a-group-to-its-rows.md) — drilling, whose detail rows this gives a coherent home
- [ADR-062](./ADR-062-grid-semantics-roving-focus-and-row-identity.md) — the roving tab stop the cell grid must preserve
- [ADR-058](./ADR-058-grouping-legality-by-analytical-role.md) — which aggregates a column may offer, including on a key column
- Issues #789 (this decision), #647 / #659 (ADR-065 and its amendment), #574 (cube), #777 (rendering a drilled group), #785 (whether columns are virtualized at all), #660 (the column axis)
