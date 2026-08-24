---
'@lcabrera/server': minor
'@lcabrera/ui': minor
---

**Breaking**, landing as a `minor` because `@lcabrera/ui` is pre-1.0 — while a
package is `0.x` a break is a `minor`, never a `major` (see `packages/CLAUDE.md`).

A group's rows now open in a **route** rather than being spliced underneath the
group row. The inline drill is gone, and with it three props.

**Removed from the public surface:**

- `onDrillGroup` (`TableLayout`) and `fetchDrill` (`TableRouteView`,
  `useTableRoutePage`)
- `isGroupDrillEnabled` (loader `meta`)
- `TableGroupDrillFetcher`, `TableGroupDrillRequest`, and the drill row types
- `toGroupKeyColumnFilter`, whose only consumer was the hand-off row

**`@lcabrera/server` gains `resolveGroupRead`** — the whole decision of what a
request that may name a group should read: token present or not, an unreadable
one refused, the translation applied, the page positioned. A route supplies only
its page ceiling, its tiebreaker column, and the catalogue lookup for a truncated
key. It returns a read or a refusal carrying the sentence to render.

**Added in their place:** `groupDetailsPath` on the loader `meta` — where the
route serves one group's rows. A path rather than a callback, because a function
does not survive the loader boundary and a path does, so the whole pair collapses
into one declaration alongside every other capability. Absent means the
affordance is not offered, so a route that declared neither is unaffected.

The innermost key of a complete group row becomes a link carrying the group as a
token plus every other search param; the route it opens reads them as its floor.
The link is not a tab stop — `tabIndex={-1}` with `Enter` handled on the focused
cell, the same rule the chevron follows, because the grid has exactly one tab
stop addressed by row key plus column key.

**Also added: `isUrlStateReadOnly`.** A table rendering inside another table's
route shares its URL, and the table persists filters and sort there. Declared, a
table reads that state as its starting floor and keeps its own adjustments in
the store; absent, a table owns its URL exactly as before.

**Why the shape changed rather than the drill being fixed.** The bounded page
never paged again, so "show me this group's orders" was permanently truncated.
The cost was not the fetch but the state around it: a four-member status per
group, chrome rows that are neither summary nor data occupying real height in
the virtualized row array, a marker field parallel to the group marker, and a
splice inside the loop that builds the row/meta pair the focus model indexes by.
A render-path `TypeError` that emptied the whole table took three composing
defects to produce, none of them in the drill's own logic and all three in
machinery that existed only to splice rows into a grid not built to have rows
spliced into it.

`TableGroupTreeRowMeta` loses `isDrillable`; `hasChildren` alone decides
`aria-expanded`, and a leaf group is simply not a tree node to open.

Migrating: replace `isGroupDrillEnabled: true` plus a `fetchDrill` prop with
`groupDetailsPath: '<your route>'` on the loader `meta`, and serve that route.
Removing them is a compile error rather than a silently inert affordance.

See ADR-087, which supersedes ADR-079.
