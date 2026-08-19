# ADR-063 — A request-shaping capability is declared once, on the loader `meta`

- **Status:** Accepted
- **Date:** 2026-08-12
- **Scope:** `@lcabrera/ui` (`components/TableRouteView`, `hooks/useTableRoutePage`, `routing/loaders`, the Table's meta state), the paginated table routes in `apps/react-router`
- **Issue:** #555 — implemented by #564
- **Amends:** [ADR-056](./ADR-056-generic-table-route-data-path.md) §4 — its reasoning and its safety property stand; only its mechanism changes
- **Related:** ADR-009 (serializable loader data — [app home](../../apps/react-router/docs/decisions/ADR-009-serializable-filter-options-descriptors.md)), ADR-043 (Changesets), ADR-046 (public API-surface snapshot), ADR-052 (keyset cursor), ADR-058 and ADR-059 (grouping)

## Context

At the time of this decision the repo has **two** mechanisms for declaring what a
table route's endpoint can do. This ADR is what collapses them, so the count is a
statement about the starting point, not something a later reader should expect to
still hold.

**Capability props on the view.** ADR-056 §4 made `filter` and `cursor` opt-in as
two `is*` booleans defaulting to `false`, declared on
[`TableRouteView.types.ts`](../../packages/ui/src/components/TableRouteView/TableRouteView.types.ts)
and consumed in
[`useTableRoutePage.hook.ts`](../../packages/ui/src/hooks/useTableRoutePage.hook.ts),
where each one conditionally contributes a key to the load-more query:

```ts
buildTablePageQuery<TData>({
  columnsState,
  limit,
  skip,
  ...(isServerFilterEnabled && { filter: columnsState.columnFilters }),
  ...(isKeysetEnabled && { lastRow }),
});
```

These are not presentation flags. They decide what the request contains, and the
`enterprise-orders` route sets both.

**`crud` on the loader `meta`.**
[`createTableRouteLoader`](../../packages/ui/src/routing/loaders/createTableRouteLoader.util.ts)
takes `meta?: Partial<TableMetaState>` and merges it into the `metaState` it
returns;
[`enterprise-orders.loader.ts`](../../apps/react-router/src/routes/enterprise-orders/enterprise-orders.loader.ts)
declares `meta: { crud: CRUD, deleteActionPath: DELETE_ACTION_PATH }`;
[`TableConfigContext.provider.tsx`](../../packages/ui/src/components/Table/contexts/TableConfig/TableConfigContext.provider.tsx)
seeds the meta store from it, and `useGetTableCrud` reads it back out. **Absent
already means off** on this side:
[`resolveTableActionsColumn.util.ts`](../../packages/ui/src/components/Table/utils/resolveTableActionsColumn.util.ts)
gates on `crud !== undefined && …`, so a route that declares no `crud` gets no
row-actions column.

Both mechanisms are visible in a single line of the tracked published surface:
`reports/api-surface/ui.txt` records `useTableRoutePage`'s parameter list naming
both `is*` props, and, in the same signature, the `metaState` it returns carrying
an optional `crud`.

Row grouping (ADR-058, ADR-059) needs a flag of exactly this kind, and
[the planning session](../agents/planning/table-row-grouping-plan.md) §3.1
designs it as a `crud`-style config on `meta`.

## Problem

Grouping has to pick a side, and either choice entrenches the split. On `meta` it
makes the view props the odd one out; on the props it makes `meta` the odd one out
and puts the flag where the code that must act on it cannot see it.

That second half is the concrete cost, not an aesthetic one. A capability that
shapes the **request** is needed on both sides of the loader boundary: the loader
builds the first page, the view builds every subsequent one. A view prop is
invisible to the loader by construction — `createTableRouteLoader` runs before any
component renders — so grouping, whose group keys must reach the server query,
cannot be declared as a prop at all without splitting its own declaration in two.

Server-side filtering already _is_ split that way, and the split is visible in one
route. `enterprise-orders.loader.ts` forwards `toQueryFilters({ filters })` to its
`fetchPage` unconditionally, so the first page is filtered because the loader body
says so; every page after it is filtered only because
`EnterpriseOrders.component.tsx` passes `isServerFilterEnabled`. One capability,
two declarations, and nothing checks that they agree — remove the prop and the
first page stays filtered while the rest do not.

The guideline that should arbitrate this does not:
[`docs/agents/cross-app-abstraction.md`](../agents/cross-app-abstraction.md)
answers _where code should live_ — extract, promote, or duplicate — and has no
rung for _where a capability flag is declared_.

## Options considered

1. **Everything on the view props.** Rejected: the loader cannot read them, so a
   request-shaping capability would be declared somewhere that cannot act on it.
2. **Everything on the loader `meta`. `Chosen.`** The loader _is_ the route: it
   already declares the page fetcher, the columns, and the schema and table
   names. It is the closest thing in the graph to the endpoint ADR-056 was
   reasoning about.
3. **Split by kind — request-shaping on `meta`, presentation on props.** This is a
   real distinction and the rule below keeps it, but as a _boundary_ on one
   mechanism rather than as an arbitration between two. Maintaining both channels
   would make "which one does this flag use" a fresh judgement call per flag,
   which is how the split arose.
4. **Leave both and document it.** Rejected: grouping would be the second entry in
   the newer mechanism, and the cost of converging rises with each one added.

## Decision

**A capability that changes a route's request shape is declared once, on the
loader `meta`, and read from the Table's meta state** — the same channel `crud`
already uses. Grouping joins them there, and `isKeysetEnabled` /
`isServerFilterEnabled` move there from the view props.

The qualifier is the boundary of the rule. "Changes the request shape" means the
flag decides what the server is asked for. A prop that carries something only the
component can supply — `TableRouteView`'s `actions` node, its `dataSelector` and
`dataTotalSelector` — is not a capability and this rule does not reach it; a
function could not cross the loader boundary anyway. The test is mechanical: if
the loader or the load-more query would have to read it, it belongs on `meta`.

**Absent means off.** A route that declares no capability meta behaves exactly as
one that passed the props as `false`. This is ADR-056's safety property carried
over intact — those props were defaulted off precisely so that adopting the
generic view could not change a route's request shape by accident, and sending a
`filter` to an endpoint that ignores it remains a correctness bug, not noise. The
meta channel already has this shape, as `resolveTableActionsColumn`'s
`crud !== undefined` guard shows, so preserving the property costs nothing.

**What of ADR-056 changes, and what does not.** Its §4 reasoning — "capability is
a property of the endpoint, which only the route knows", and "defaulting them off
makes the safe choice the silent one" — survives unchanged; the loader is the
route. Its §4 _mechanism_, two view props, is superseded. Nothing else in ADR-056
is affected: `createPaginatedFetcher`, `buildTablePageQuery`, the required
response guard and the derived `TableRouteLoaderData` all stand. This is an
amendment on new information — a capability arrived that the loader itself must
act on, a case ADR-056 did not have in front of it — not a reversal.

The refactor is **#564**. This ADR decides the rule; it deliberately does not
design the types, the meta key, or the migration mechanics.

## Consequences

**This is a breaking change to a published package's props surface, and it
requires a changeset.** `packages/ui/package.json` carries `"private": false`, so
nothing but the version number stands between a merge and the registry, and an npm
version is permanent. Dropping the two props rewrites the recorded signature of
`TableRouteView`, `TableRouteViewProps` and `useTableRoutePage`, which
[`api-surface-diff.mjs`](../../packages/repo-standards/scripts/api-surface-diff.mjs) classifies as
`changed` — breaking — and
[`api-surface-changeset.mjs`](../../packages/repo-standards/scripts/api-surface-changeset.mjs) then
marks `required`, so the "Public package API surface is unbroken" step in
[`check-safe.yml`](../../.github/workflows/check-safe.yml) hard-fails without a
`@lcabrera/ui` changeset. #564 must carry one and regenerate the snapshot with
`vp run api-surface:verify -- --write`.

**Migration, for a consumer outside this repo.** A consumer that passed neither
prop does nothing: absent meta reproduces the previous `false` default exactly. A
consumer that passed either one moves it into the loader for the same route — into
the `meta` argument of `createTableRouteLoader`, or, if the loader is hand-written,
into the `metaState` it returns — and deletes the prop from the component. Nothing
else moves: both `TableRouteView` and `useTableRoutePage` already require loader
data of this shape, so every affected consumer has a loader to move the flag to.
The compile error names the removed prop, so the failure mode is a build break at
upgrade, not silent behaviour change.

**One place to look.** "What can this table route do?" becomes a single question
with a single answer, readable from the loader without cross-referencing the
component tree.

**A capability now travels with the data.** `meta` is loader data, so a capability
flag is serialized on every navigation. That is a handful of booleans, so the
payload cost is not the point — the constraint is that a capability can only be
plain serializable data, never a function or an object carrying behaviour.
`createTableRouteLoader` already states this for everything it returns (ADR-009),
and it is worth naming here because it forecloses a "capability object with
methods" design before someone proposes one.

**The guideline stays incomplete until it is amended.** This ADR decides the
instance; without a corresponding rung in `cross-app-abstraction.md` the next
capability re-asks the question from scratch. That is #589.

## Alternatives considered

**Rejected on reasoning, not evidence: keeping ADR-056's props.** The decision
that produced them is sound and its safety property is preserved here. What
changed is that a capability arrived which the loader must act on.

**Rejected: inferring a capability from the route's shape** — for example, "if the
loader has a `.server/` service, grouping is available". Implicit capability is
exactly how a route's request shape changes without anyone deciding it should,
which is what ADR-056's default-off rule exists to prevent.

**Rejected: a third channel, such as a capability argument threaded separately
through both halves.** It would satisfy "the loader can see it" without touching
the props, but at the cost of three mechanisms where the complaint was two.

## References

- [ADR-056](./ADR-056-generic-table-route-data-path.md) §4 — the decision this amends
- [ADR-046](./ADR-046-public-api-surface-snapshot.md) — the gate that makes the breaking change mechanical
- [ADR-058](./ADR-058-grouping-legality-by-analytical-role.md), [ADR-059](./ADR-059-aggregation-is-builder-generated.md) — the grouping decisions whose flag prompted this
- [`docs/agents/planning/table-row-grouping-plan.md`](../agents/planning/table-row-grouping-plan.md) §3.1 — the `crud`-style opt-in flag as designed
- [`docs/agents/cross-app-abstraction.md`](../agents/cross-app-abstraction.md) — the guideline that does not yet cover this question
- Issues #555 (this decision), #564 (the refactor), #589 (the guideline rung), #547 (the grouping epic)
