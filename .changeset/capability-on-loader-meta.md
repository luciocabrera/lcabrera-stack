---
'@lcabrera/ui': minor
---

**Breaking:** a table route's request-shaping capabilities are declared once, on
the loader `meta`, and no longer as props on the view (ADR-063).

`TableRouteView` and `useTableRoutePage` lose `isKeysetEnabled` and
`isServerFilterEnabled`. Both flags now live on `TableMetaState`, the channel
`crud` and `deleteActionPath` already use, and the load-more query reads them
from the loader data.

**Why.** A capability that shapes the request is needed on both sides of the
loader boundary: the loader builds the first page, the view builds every page
after it. A view prop is invisible to the loader by construction, so server-side
filtering was declared twice — once in the loader body that forwards `filters`,
once as a prop — with nothing checking that the two agreed.

**Migration.** A consumer that passed neither prop does nothing: absent meta
reproduces the previous `false` default exactly, so the request shape is
unchanged. A consumer that passed either prop moves it to the loader for the same
route and deletes it from the component:

```ts
// before — the loader
export const loader = createTableRouteLoader<Row, RowResponse>({
  /* … */
  meta: { crud: CRUD },
});
```

```tsx
// before — the component
<TableRouteView<Row, RowResponse>
  fetchPage={fetchRowsPage}
  isKeysetEnabled
  isServerFilterEnabled
/>
```

```ts
// after — the loader carries the capability
export const loader = createTableRouteLoader<Row, RowResponse>({
  /* … */
  meta: { crud: CRUD, isKeysetEnabled: true, isServerFilterEnabled: true },
});
```

```tsx
// after — the component declares only what it alone can supply
<TableRouteView<Row, RowResponse> fetchPage={fetchRowsPage} />
```

A hand-written loader puts the same two keys on the `metaState` it returns.
Nothing else moves — both `TableRouteView` and `useTableRoutePage` already
require loader data of this shape, so every affected consumer has a loader to
move the flag to. The removed props are a compile error naming the prop, so the
failure mode at upgrade is a build break, not a silent change of behaviour.

**Absent still means off.** A route that declares no capability meta sends
exactly what one declaring both `false` sends. That was ADR-056's safety
property — the flags default off so that adopting the generic view cannot change
a route's request shape by accident — and it is carried over unchanged, because
sending a `filter` to an endpoint that ignores it appends unfiltered rows to a
filtered table.
