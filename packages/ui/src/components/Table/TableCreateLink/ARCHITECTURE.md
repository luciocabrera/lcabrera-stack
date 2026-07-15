# TableCreateLink Architecture

The "create a new X" action meant to be passed into a `Table`'s (or
`TableLayout`'s/`StaticTable`'s) `actions` prop. Icon-only (`+`), sized to
match the built-in table-settings gear button (`size='mini'`) that always
renders next to whatever's passed into `actions` — see
`TableContent.component.tsx`, which appends that gear button after
`actions` in the same row.

## Public API

- `TableCreateLink` — `title: string` (whatever the table's own title is,
  e.g. `'Projects'`), `to: string` (route to navigate to), `isBusy?: boolean`
  (default `false`). Renders `variant='outline'`, tooltip/aria-label
  `"Create {title}"`. When rendered by the table's built-in CRUD-create path
  (`TableTitleActions`), `isBusy` is fed the table's `isLoading` so this button
  shows the same shimmer overlay as the adjacent settings gear button while the
  table loads.

## Why this exists as its own component

Every CQMS-style list route needs the identical "+" button pattern next
to its table title — this is the second time this exact composition
(`NavLink` + `PlusIcon` + `size='mini'` + `variant='outline'` + a computed
tooltip) would otherwise get hand-copied per route. `title` is passed
explicitly rather than read from the `Table`'s own `metaState.title` (the
same string is usually passed to both) because `actions` renders as a
sibling prop value, computed before the `Table` it's passed into has
read its own state.

## File Structure

- `TableCreateLink.component.tsx` — the render
- `TableCreateLink.types.ts` — `TableCreateLinkProps`
- `TableCreateLink.test.tsx` — link href + aria-label + busy `aria-disabled`
- `index.ts` — barrel: component + type

## Consumer

CQMS's project list (`Cqms.component.tsx`) — `<TableCreateLink title='Projects' to='/cqms/projects/new' />` passed into `TableLayout`'s `actions` prop.
