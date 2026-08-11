# A table capability is declared once, on the loader `meta`

**Status:** Proposed

<!-- Draft — no number until adoption (see README.md). Home at adoption:
     docs/decisions/ — it amends ADR-056 and changes a published props surface. -->

## Context

There are already **two** mechanisms in this repo for declaring what a table
route's endpoint can do.

ADR-056 decided that endpoint capabilities are **props on the generic view**,
defaulting to off — `isKeysetEnabled`, `isServerFilterEnabled` — reasoning that
"capability is a property of the endpoint, which only the route knows", and
defaulting them off so that adopting the generic view could not change a route's
request shape by accident.

Meanwhile CRUD is declared on the **loader `meta`**, read back from the Table's
meta state.

Row grouping needs a capability flag of exactly this kind: a route opts in, and
everything else derives from what the route already declares.

## Problem

Grouping has to pick a side, and either choice entrenches the split. Adding
`grouping` to the view props makes the loader `meta` the odd one out for `crud`;
adding it to `meta` makes the view props the odd one out for the two ADR-056
capabilities. A third mechanism is not on the table, but neither is leaving two.

The concrete cost is not aesthetic. A capability that changes the **request
shape** is read by the loader; a capability declared as a view prop is not visible
to the loader at all, so any capability that must influence the generated query has
to be declared somewhere the loader can see it — which is `meta`. Grouping is
exactly such a capability, and so, arguably, is server-side filtering.

The guideline that should arbitrate this does not cover it:
`docs/agents/cross-app-abstraction.md` answers _where code should live_, in an
ordered set of steps, and has no rung for _where a capability flag is declared_.

## Options considered

1. **Everything on the view props.** Rejected: the loader cannot see them, so any
   request-shaping capability (grouping, server filtering) is declared in a place
   that cannot act on it — the flag and its effect live in different graphs.
2. **Everything on the loader `meta`. `Chosen.`** The loader _is_ the route: it
   already declares the page fetcher, the columns, the schema and table names. It
   is the closest thing in the graph to the endpoint ADR-056 was reasoning about.
3. **Split by kind — request-shaping on `meta`, presentation on props.** Rejected:
   it is a real distinction, but it makes "which mechanism does this flag use" a
   judgement call on every new flag, which is how two mechanisms became two
   mechanisms in the first place.
4. **Leave both and document the split.** Rejected: grouping would be the second
   entry in the newer mechanism, and the cost of converging rises with each one.

## Decision

**Capabilities that change a route's request shape are declared once, on the
loader `meta`**, and read from the Table's meta state — the same channel `crud`
already uses. `grouping` joins them there.

**Absent means off.** This preserves ADR-056's safety property exactly: a route
that declares no capability meta behaves identically to one that declared the
props as `false`, so adopting the generic view still cannot change a route's
request shape by accident.

The two existing view-prop capabilities move to `meta`. ADR-056's _reasoning_
survives the move unchanged — only its _mechanism_ changes.

## Consequences

**This is a breaking change to a published package's props surface.** It requires
a changeset and a regenerated API-surface snapshot, and any external consumer
passing those props must move them to their loader. That cost is paid once and is
the reason to do it now rather than after grouping adds a third flag to the wrong
side.

**One place to look.** "What can this table route do?" becomes a single question
with a single answer, readable from the loader without cross-referencing the
component tree.

**A capability now travels with the data.** Because `meta` is loader data, a
capability flag is serialized on every navigation. It is a handful of booleans, so
the payload cost is negligible — but it does mean a capability cannot be a
function or carry behaviour, only plain serializable data. That constraint is
already true of everything crossing the loader boundary and is worth stating
because it forecloses a "capability object with methods" design.

**The guideline stays incomplete until it is amended.** This ADR decides the
instance; without a corresponding rung in `cross-app-abstraction.md`, the next
capability re-asks the question from scratch.

## Alternatives considered

**Rejected on reasoning, not evidence: keeping ADR-056's props.** The decision
that produced them is sound and its safety property is preserved here. What
changed is that a capability arrived which the loader must act on, and ADR-056 did
not have that case in front of it. This is an amendment on new information, not a
reversal.

**Rejected: inferring the capability from the route's shape** (e.g. "if the loader
has a `.server/` service, grouping is available"). Implicit capability is how a
route's request shape changes without anyone deciding it should — precisely what
ADR-056's default-off rule exists to prevent.

## References

- [ADR-056](../../../decisions/ADR-056-generic-table-route-data-path.md) — the decision this amends
- `docs/agents/cross-app-abstraction.md` — the guideline that does not yet cover this question
- `docs/agents/planning/table-row-grouping-plan.md` §2.2, §3.1
- Backlog entries P-06 (this ADR), P-15 (the refactor), G-09 (the guideline rung)
