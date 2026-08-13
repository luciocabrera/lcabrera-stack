# ADR-067 — Expansion is stored as the collapsed set, and the visible rows are the grid

- **Status:** Accepted
- **Date:** 2026-08-13
- **Scope:** `@lcabrera/ui` — `src/components/Table/` expansion state, the derived row set, and the `treegrid` semantics and keyboard contract built on it
- **Issue:** #571 — refines [ADR-061](./ADR-061-grouping-config-in-url-expansion-in-store.md) and [ADR-062](./ADR-062-grid-semantics-roving-focus-and-row-identity.md)
- **Related:** [ADR-065](./ADR-065-grouped-rows-render-a-hierarchy-column.md) (what a group row renders), [ADR-059](./ADR-059-aggregation-is-builder-generated.md) (a grouped read returns whole), [ADR-009](../../apps/react-router/docs/decisions/ADR-009-serializable-filter-options-descriptors.md) (loader-crossing data is plain and serializable)

## Context

[ADR-061](./ADR-061-grouping-config-in-url-expansion-in-store.md) decided where
expansion lives — the client store, keyed by group path — and left four things
to whoever built it: which store, which direction the state is held in, what
"the grid's rows" means once some of them are hidden, and how the tree is
operated from the keyboard.

[ADR-062](./ADR-062-grid-semantics-roving-focus-and-row-identity.md) settled the
grid's roles, its single roving tab stop and its focus-recovery rule, and said
explicitly that the recovery rule is generic: _"Every later feature that removes
rows from the rendered set still has to decide whether the generic answer is the
right one for it — grouping's collapse is the first such case."_

[ADR-065](./ADR-065-grouped-rows-render-a-hierarchy-column.md) decided what a
group row renders. It does not decide any of the above, and this decision does
not depend on it: everything here is stated over rows and their paths, not over
cells.

## Problem

Four questions, each with a plausible wrong answer that would only show up later.

**Which store.** ADR-061 says expansion joins the grouping store. But
`TableGroupingState` is not only the store's type: it is the URL codec's
(`serializeGroupingToURL` / `deserializeGroupingFromURL`), the loader's
(`createTableRouteLoader`'s `grouping`), and the drawer draft's. Everything in it
crosses the single-fetch boundary, where a `Set` does not survive (ADR-009).

**Which direction.** "Expansion" can be held as the open paths or as the closed
ones, and the choice is not cosmetic: it fixes the default for every grouped
table, because the empty set means "all collapsed" in one reading and "all
expanded" in the other.

**What the grid's rows are.** `aria-rowcount`, `aria-rowindex`, the
virtualization window and the focus store's `rowIndex` are four numbers derived
from what is currently a single array. Collapsing removes rows from the middle of
it. If those four stop agreeing, the failures are silent: a body taller than its
contents, an `aria-rowindex` sequence with holes, a keypress consumed by a row
nobody can see.

**How the tree is operated.** `role="treegrid"` commits to the tree keyboard
conventions the way `role="grid"` committed to the grid ones, and this grid has
no row-focus mode to hang them on — focus is always on a cell.

## Decision

### 1 — Expansion is its own store on the config context

A fourth store, `expansionStore`, holding `TableGroupExpansionState`. It sits
beside `groupingStore` on `TableConfigProvider`, so it keeps the whole lifecycle
argument ADR-061 made — outside Suspense, surviving the data context being
re-created on every navigation — and it stays out of the type that crosses the
loader boundary.

This is a refinement of ADR-061's "expansion joins the grouping store", not a
reversal: the reason it does not join is the loader boundary, which that ADR did
not have in view.

### 2 — The state is the **collapsed** paths, so a tree defaults to open

`collapsedGroupPaths: ReadonlySet<string>`; membership means hidden. An empty set
is a fully expanded tree, and that is the initial state — the same inversion
`ColumnVisibilityState` already uses for hidden columns.

The alternative — store the open paths, default everything closed — is the more
common grid default and it is wrong **here**, because of what a grouped read
returns. ADR-059 fixed that a grouped read returns whole: every level of the
result is already materialised in memory by the time the client renders it, and
lazy per-level fetching is an explicit non-goal (#571 §5). Defaulting to closed
would therefore hide data that has already been fetched and paid for, and would
buy nothing back — no request is avoided, because no request was going to be
made.

There is deliberately no loader seed for it. Expansion does not travel in the URL
(ADR-061), so a cold load has nothing to restore, and inventing a default depth
would make a shared link render differently for the recipient than for the
sender, for a reason neither could see.

A member is a group's whole path, encoded by `resolveGroupPathKey`, and
`resolveRowKey` calls that same function for a group row's identity rather than
repeating the encoding. That is what makes "re-applied by path" mean the path:
the string a collapse is remembered by and the string the rendered row is
identified by are produced by one function.

### 3 — A collapsed path is dropped once no row carries it

Reconciled against each new set of rows. A sort change reorders rows without
touching any group's key values, so every collapse survives it; a filter change
can remove a group outright, and a path with nothing left to hide is dropped.

The alternative is to keep it and let it lie dormant. That is not "harmless
until the group returns" — it is precisely wrong when the group returns, because
it re-collapses from state the user last set on data that no longer exists.

### 4 — Under a tree, the grid's rows are the **visible** rows

One derivation, `resolveTableGroupTree`, produces the row set and each row's
place in the tree, and every count downstream comes from it: the virtualization
window, `aria-rowcount`, the body's `aria-rowindex` sequence, and the row index
the focus store holds.

This changes an ADR-062 invariant, and the change is the point. There,
`aria-rowcount` is `totalRows + 1` over the whole dataset and a body row's index
is its absolute position in it. Under a tree the dataset **is** the visible rows:
a collapsed row is not a row of the grid at all, so counting it would advertise a
row no `aria-rowindex` can ever be emitted for. ADR-062's invariant — that the
largest index the grid emits equals the count it advertises — is preserved, and
it is preserved by deriving both from the same array. Outside a tree the
derivation returns the caller's own array by reference, so an ungrouped grid
sees no behaviour change and no allocation — but the second half of that holds
only because deciding there is no tree is an `every` over the rows rather than a
`map` building an N-length array of summaries to throw away. Written the obvious
way the sentence would be false, and three call sites lean on it per render, so
the cost and the shape that buys it are stated together rather than one being
inferred from the other.

Ancestry is read off a group's **path**, not off its position among the rows.
Every grouping set either mode emits is a prefix of the key list (ADR-065), so a
row's ancestors are the prefixes of its own path, and reading it that way means a
group's depth and parent do not depend on emission order — which is what keeps
rollup's "subtotals follow their children" ordering (#570) from silently
inverting the tree. A **detail** row has no path, so it is attributed to the
nearest group row above it; that one half does assume group-before-children and
is the half #570 has to revisit if it reorders them.

### 5 — `treegrid` is asked of the rows, and every row is annotated

The grid declares `role="treegrid"` when the loaded rows contain a group row, and
`role="grid"` otherwise — the same question `TableBodyRows` already asks to
decide which component a row gets, rather than asking the grouping
configuration. A grouped read that returned no groups is not a tree and is not
announced as one.

Under a tree, **every** body row carries `aria-level`, `aria-posinset` and
`aria-setsize` — group and detail alike — because two rows exposing different
structures is what makes a tree unreadable rather than merely under-annotated.
`aria-expanded` is the exception and is written only on a row that has children:
on a leaf it would announce a control the user cannot operate.

### 6 — `ArrowRight` expands and `ArrowLeft` collapses, on a group row, with navigation as the fallback

The treegrid pattern gives the two horizontal keys to expansion when focus is
"on a row". This grid has no row-focus mode, so the condition that stands in for
it is that the focused row is a group row with children.

Each key does one job at a time and the other is the fallback: `Right` expands a
closed group and, once it is open, moves between cells as it does anywhere else;
`Left` collapses an open one and then moves. No horizontal navigation is lost —
it is reached by pressing the key twice — and neither key is ambiguous, because
the row's own state decides which meaning is live.

### 7 — A collapse that hides the focused row moves focus to the collapsed group row

Not to ADR-062's generic answer. That rule hands focus to the nearest surviving
row at the same absolute index, which after a collapse is whatever shifted up
into that slot — typically a row in a **different** group. An interaction that
asked only to fold something away would move the user sideways in the data.

The collapsed group row is the nearest surviving ancestor of everything the
collapse hid, so focus lands on the row the user just acted on. One path
collapses per interaction, so "the focused row is gone" identifies that ancestor
without walking back up the tree for it.

Two details follow, and both are about not lying:

- The focus target moves, but DOM focus is only **requested** while focus was
  already inside the grid. A collapse is not the user asking for focus; raising a
  request when they are working elsewhere on the page would pull focus back into
  the table.
- The grid container takes the tab stop back in the same write. The mechanism
  ADR-062 relies on — a cell releasing the stop as it unmounts — cannot fire
  here, because the store has just been re-pointed away from that cell, and a
  browser does not reliably raise `focusout` for a node it has removed. Without
  the explicit release the grid would be left with no `tabIndex={0}` anywhere and
  would stop being reachable by `Tab`. A cell that does mount for the new target
  claims the stop straight back through its own focus event.

## Consequences

**A grouped table now has four stores' worth of state behind one grid.** The
split is the price of ADR-061's lifecycle guarantee plus ADR-009's serialization
one, and it is visible in every action that has to collapse: the expansion action
reads the expansion, data, columns, meta and focus stores. That is the same shape
`useMoveTableGridFocus` already had, so it is not a new kind of coupling, but it
is more of it.

**The tree derivation runs on the render path, three times per render.** The grid
element, the virtualization window and the row loop each call the hook, and each
gets its own React Compiler memo cell keyed on the rows and the collapsed set
(ADR-004). The short-circuit for a non-tree is what keeps that acceptable: an
ungrouped table walks the rows once looking for a group summary, allocating
nothing, and returns its own array.

**The derivation may not use iterator helpers, and that is a package-wide
constraint rather than a preference here.** `@lcabrera/ui` ships **source** —
`files: ["src"]`, every `exports` entry pointing at a `.ts` file — so a consumer
compiles these files with their own `target` and runs them on their own runtime.
`Iterator.prototype.filter`/`toArray` are ES2025 runtime **methods**, not syntax,
so a downlevel target cannot rewrite them; only a polyfill helps, and requiring
one of every consumer is not a contract this package offers. The probe, which
discriminates because a syntax feature would come back rewritten: compiling
`nodes.entries().filter(…).toArray()` at `--target es2018 --lib es2018` reports
`TS2339: Property 'filter' does not exist on type 'ArrayIterator<…>'`, and
emitting anyway produces the call **verbatim**. Iterating `array.entries()` with
`for...of` is ordinary ES2015 and carries none of this, which is what the
derivation uses.

**#651 is not closed by this.** A group row still registers no cell, so a focus
target on one is a target no node answers: the container keeps DOM focus and the
keypress that moved there appears to do nothing. Expansion inherits that rather
than causing it, and `Table.treeExpansion.test.tsx` records the whole trace
including those entries, so what the fix changes is visible. ADR-065 closes it by
giving a group row real cells (#570).

**Two blanks in the keyboard contract, left blank on purpose.** The treegrid
pattern also gives `Left` a second job on a row that is already collapsed — move
to the parent row — and defines `Home`/`End` over the tree rather than the row.
Neither is implemented: #571's scope is the expansion keys, and adding tree
navigation on top of the grid's clamped cell navigation is a separate decision
about which map wins.

**A collapse is not reachable by mouse yet.** The expansion action is written and
keyboard-operable; the affordance that a pointer uses is the chevron in the
hierarchy column, which is ADR-065's and #570's. Until it lands, the only
pointer path is a consumer calling the action.

## Alternatives considered

**Rejected: expansion as a field on `TableGroupingState`.** It is what ADR-061
names, and it puts a `Set` into the type the loader returns and the URL codec
round-trips. Every construction site of that type — the codec, the sanitizer, the
loader factory, the drawer draft — would have to carry a field none of them has
any business with, and the one that crosses the single-fetch boundary would
carry a value that does not survive it.

**Rejected: store the expanded paths and default to collapsed.** The usual grid
default, and it is answering a cost this grid does not pay: with a lazily-fetched
tree, collapsed-by-default is what stops the client fetching levels nobody asked
for. A grouped read returns whole (ADR-059), so the rows are already in memory
and hiding them by default withholds data at no saving.

**Rejected: keeping a collapsed path that no longer matches any row.** Cheaper —
no reconciliation — and it fails in the one case it exists for: the group comes
back and is silently re-collapsed from state set on data that has since been
replaced.

**Rejected: leaving `aria-rowcount` on the dataset while rows are hidden.** It
keeps ADR-062's rule verbatim and makes it false: the count would exceed the
largest `aria-rowindex` the body can emit, which is exactly the disagreement
ADR-062 says to write a test for.

**Rejected: deriving a row's depth from its position among the rows.** A running
stack of preceding group rows is the obvious walk and it reads emission order as
structure. Rollup emits subtotals after their children (#570), so a depth read
that way would invert under the very mode this has to survive. Prefixes are a
property of the row.

**Rejected: ADR-062's generic focus recovery for a collapse.** Stated above: the
nearest survivor at the vacated index is a row in another group, so the fold
would move the user sideways. ADR-062 anticipated this and required the decision
to be made per feature rather than inherited.

## References

- [ADR-061](./ADR-061-grouping-config-in-url-expansion-in-store.md) — where expansion lives, and the path key that makes it survive a refetch
- [ADR-062](./ADR-062-grid-semantics-roving-focus-and-row-identity.md) — the grid roles, the roving tab stop, and the generic focus-recovery rule this one refines
- [ADR-065](./ADR-065-grouped-rows-render-a-hierarchy-column.md) — what a group row renders, and why prefixes are what a grouping mode emits
- [ADR-059](./ADR-059-aggregation-is-builder-generated.md) — a grouped read returns whole, which is why the default is expanded
- [ADR-009](../../apps/react-router/docs/decisions/ADR-009-serializable-filter-options-descriptors.md) — loader-crossing data is plain and serializable
- [`packages/ui/src/components/Table/TableRow/ARCHITECTURE.md`](../../packages/ui/src/components/Table/TableRow/ARCHITECTURE.md) — the height invariant a collapse must not disturb
- Issues #571 (this decision), #553 / #561 (ADR-061's slices), #554 / #560 (the focus model), #647 / #659 (the group-row shape), #570 (rollup ordering), #651 (the group row that answers no focus request)
