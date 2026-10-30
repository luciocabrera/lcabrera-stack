---
governs:
  - ui
  - utils
---

# ADR-146 — Build an application's UI from the component library, and extend the library where it falls short

**Status:** Accepted

**Date:** 2026-10-30

**Issue:** [#1550](https://github.com/luciocabrera/lcabrera-stack/issues/1550), part of [#1549](https://github.com/luciocabrera/lcabrera-stack/issues/1549)

**Relates to:** [ADR-039](ADR-039-duplicate-over-undeclared-edges.md) (duplicate over undeclared edges), [ADR-118](ADR-118-split-tablemetastate-into-capability-grouping-query-and-chrome.md) (`TableMetaState` chrome), [ADR-142](ADR-142-a-table-given-rows-keeps-its-state-in-memory-and-the-route-level-layout-supplies-persistence.md) (a `Table` given rows, and the removal of `StaticTable`)

## Context

`@lcabrera/ui` is meant to be the UI an installing application builds its pages
from. In practice an application still draws much of it by hand: small
read-only tables, page headings, breadcrumbs, fact lists, native form controls,
line charts and heat maps. Whatever one application builds for itself, the next
one that installs the package builds again, so each of those gaps is a gap in the
package.

Five questions came up while planning the work that closes those gaps. Each one
would otherwise be argued again in every pull request that touches it.

**Density.** `TableDensity` is `'compact' | 'comfortable'`, defaults to
`'compact'`, and is stored in `TableMetaState`, so a caller that saves its meta
state saves the density with it. The value reaches `TableBase`, which sets two
CSS variables, `--table-padding-block` and `--table-padding-inline`. Nothing
reads them: the body cell, the header cell and the header band each set a fixed
`6px` inline padding, and the row height is `rowHeight`, which defaults to
`DEFAULT_ROW_HEIGHT` (32) whatever the density is. Both values render the same
table today. A table of wide numeric data and a table with a chart in each cell
need different row heights and font sizes, and there is no way to ask for
either.

**A small read-only table.** `Table` virtualises its rows, fills the height of
its container, renders `role="grid"` with roving focus, and mounts the toolbar,
the settings drawer, the column menu and resize handles. A table of a handful of
rows inside a card or a page section needs none of that, and inside a parent
with no height it renders no rows at all. ADR-142 removed `StaticTable` and
decided that a second table component is not the answer.

**Applications and the package.** Nothing states that an application takes its
generic UI from the package rather than drawing its own, or what happens when
the package cannot draw something.

**The router and React.** The package's components render under React Router
framework mode on React 19. The router already provides links, forms, pending
navigation state, matched-route handles and the `meta` export, and React 19
provides ref-as-prop, `use()`, `useId` and Suspense. A component that rebuilds
any of these instead of wrapping it drifts from the router and breaks before
hydration.

**Charts.** The package has one chart, `TrendSparkline`, which computes its own
geometry inside the component. A line chart and a heat map need scales, ticks,
paths and decimation, which are pure arithmetic and worth testing on their own.

## Decision

### (a) Density sets row height and font size first, and padding follows

- `TableDensity` is `'dense' | 'compact' | 'comfortable' | 'spacious'`. Each
  level sets a row height, a body font size and a header font size, and the
  cell padding is derived from those:

  | Level         | Row height | Body font    | Header font            | Inline padding |
  | ------------- | ---------- | ------------ | ---------------------- | -------------- |
  | `dense`       | 24px       | `fontSizeXs` | `fontSizeXs`, semibold | `spacing.xxs`  |
  | `compact`     | 32px       | `fontSizeSm` | `fontSizeSm`, semibold | `spacing.xs`   |
  | `comfortable` | 40px       | `fontSizeSm` | `fontSizeSm`, semibold | `spacing.sm`   |
  | `spacious`    | 48px       | `fontSizeMd` | `fontSizeSm`, semibold | `spacing.md`   |

- The two existing names keep their meaning and their spelling. A level's
  meaning is its row height and body font, the two values that drive it.
  `compact` stays the default and keeps the 32px row and `fontSizeSm` body every
  table renders today. `comfortable` stays the looser of the two, and now
  renders the 40px row its name described all along. A saved meta state holding
  either value loads as it is, with no migration and no rename.
- Density gives the default row height, and the virtualiser and the row read
  that one value. A `rowHeight` the caller sets explicitly still wins over it.
- `headerDensity` sets the header row's level on its own, and defaults to
  `density`.
- `density` and `headerDensity` are props on `Table` for both data sources, as
  well as fields of the meta state `TableLayout` reads.
- Cells read their padding and font from CSS variables the density sets. No
  cell keeps a fixed padding or font size of its own.

### (b) A static table is a layout of `Table`, not a second component

- `Table` takes `layout?: 'virtual' | 'static'`, defaulting to `'virtual'`,
  which is today's behaviour.
- A static table renders every row with no virtualisation, takes its height from
  its rows rather than from its container, and may set `rowHeight: 'auto'`, in
  which case the density sets a minimum row height and the font.
- A static table renders `role="table"` and keeps the normal tab order, with no
  roving focus. Grid keyboard behaviour stays with the virtual layout.
- `features` (`toolbar`, `settings`, `columnMenu`, `resize`) switches the
  table's chrome. Each defaults to on in the virtual layout and off in the
  static one, and a static table mounts only the providers its rows need.
- A column takes `align` (`'start' | 'center' | 'end'`, defaulting to what its
  `dataType` gives) and `width` (a number, or `'fill'`). A table takes
  `caption`, rendered as `<caption>`, and `footer`, rendered as `<tfoot>`.
- The data inputs do not change: `columns` and the one `response` input from
  ADR-142, in both layouts.

### (c) Applications take their UI from the package

- An application renders tables, headings, form controls, page headers, fact
  lists and charts through `@lcabrera/ui`, not as hand-written elements.
- When the package cannot draw what an application needs, the package is
  extended. An existing component gains a prop before a new component is added,
  and a new component is added only once it has been agreed.
- A component only one application would ever use is an exception. It stays in
  that application, after discussion, and its row in that application's
  `INVENTORY.md` states why it is not in the package.

### (d) The package wraps router and React features and never rebuilds them

- Navigation is the router's `Link` and `NavLink`, forms are its `Form`, pending
  state comes from `useNavigation` or `useFetcher`, breadcrumbs come from
  `useMatches()` and each route's `handle`, and the document title comes from
  each route's `meta` export. A package component wraps these. It does not
  navigate from an `onClick`, copy URL state into `useState`, fetch in a
  `useEffect`, or set `document.title`.
- A component that needs a data router says so in its documentation and has a
  test that renders it inside one.
- A ref is an ordinary prop. No new component uses `forwardRef`.
- A form control renders a named native element, so a form submits before
  hydration as well as after.
- A component renders the same markup on the server and the client. It reads no
  `window` and measures no element during render, and its ids come from
  `useId`.

### (e) Charts live in `ui`, and their geometry lives in `utils`

- `LineChart` and `Heatmap` are components of `@lcabrera/ui`, beside
  `TrendSparkline`.
- Their geometry is pure functions in `@lcabrera/utils`: linear and time
  scales, nice ticks, line and band paths, and decimation of a long series with
  largest-triangle-three-buckets (LTTB). The functions take numbers and dates,
  return numbers and path strings, and use no DOM and no React. `TrendSparkline`
  is redrawn on the same functions.
- A chart takes values, tones and link targets. It computes no statistic: a
  caller that wants a confidence interval drawn computes the bounds and passes
  `lower` and `upper`.
- A chart sizes itself from its SVG `viewBox` and positions its text by
  percentage, so it measures nothing and renders the same markup on the server
  and the client.

## Consequences

- **A saved `comfortable` table renders taller.** Today it renders at 32px like
  `compact`. After (a) it renders at 40px with wider padding. The value loads
  unchanged, but the table looks different. That is the cost of giving the
  existing name the meaning it already claimed instead of leaving it inert. A
  caller who wants the old look sets `compact`.
- **A default table's inline padding changes slightly.** Today every cell sets
  a fixed `6px` inline padding. Under `compact` it becomes `spacing.xs`, while
  the row height, the body font and the `fontSizeSm` header stay as they are.
  That is the only visible change to a table that keeps the default, and the
  changeset that ships (a) says so. A `fontSizeXs` header applies only at
  `dense`.
- `TableDensity` widens from two members to four. Code that switches on it
  exhaustively stops compiling until it handles the two new levels. The change is
  recorded in the API surface and needs a changeset.
- The settings drawer shows four density levels instead of two.
- A static table changes how a screen reader presents it: a table rather than a
  grid. Every focusable element in it is a tab stop, so a link in a cell is
  reachable with Tab, and a table with many linked cells has many tab stops.
- Each static table on a page still mounts some of `Table`'s providers. It
  mounts fewer than the virtual layout, but it costs more than a plain
  `<table>`, and a page with many of them has to be measured rather than
  assumed cheap.
- A column that renders a link needs a render function, and a render function
  cannot be serialised from a loader. Such a column is built in the component
  that renders the table.
- (c) adds work to the package for every gap an application finds, and the
  public surface grows with each one. Each new export takes a changeset, an
  API-surface entry and an `INVENTORY.md` row.
- (d) ties the package more firmly to React Router. It is already a required
  peer (ADR-142), and a component that needs a data router cannot render
  outside one.
- The router's `NavLink` matches only the pathname, so a view selected by a
  search parameter is not marked active on its own. The caller passes
  `isActive` from the search params or loader data.
- (e) adds a public module to `@lcabrera/utils`, which then has to stay pure and
  client-safe.
- A chart that measures nothing cannot fit its labels to the space it has. Long
  labels are for the caller to shorten or format.

## Alternatives considered

- **Keep density as padding only, and leave row height to `rowHeight`.**
  Rejected: padding is the part of density a reader notices least, and a row
  that keeps 32px while its padding grows clips its content. Row height and font
  size are what make a level fit its data.
- **Rename the density levels to a fresh scale** (for example `sm` to `xl`).
  Rejected: a saved meta state holding `compact` or `comfortable` would load a
  value the type no longer accepts.
- **Keep `comfortable` at 32px so no saved table changes.** Rejected: two of the
  four names would render the same row, and the name would keep promising
  something the table does not do.
- **A separate `StaticTable` component.** Rejected again, for the reason ADR-142
  gives: a second table component duplicates what `Table` can do, and every
  column option, cell renderer and density level would have to work in both.
- **A `virtualize={false}` boolean.** Rejected: a static table differs in more
  than virtualisation. It changes the role, the focus model, the sizing and the
  default chrome. One `layout` value names that set, where separate booleans
  would allow combinations nothing supports.
- **Let each application keep its own copy of generic UI.** Rejected: every
  copy is written again by the next application, and none of them is held to the
  package's gates.
- **Package components that manage navigation or form state themselves**, so
  they work without a router. Rejected: they would duplicate the router, fail
  before hydration, and drift from what the router does on the server.
- **Chart geometry inside `ui`, next to the components.** Rejected: the
  functions are pure and need no React. In `utils` they can be tested and
  mutation-tested on their own, and a caller can run them on the server while
  preparing chart data.
- **A charting library as a dependency.** Rejected: the common ones measure
  their container or read `window` during render, which breaks server rendering
  and hydration, and each adds a dependency every installer of `ui` inherits.

## References

- [#1549](https://github.com/luciocabrera/lcabrera-stack/issues/1549), and the sub-issues that implement each part: [#1559](https://github.com/luciocabrera/lcabrera-stack/issues/1559) for (a), [#1560](https://github.com/luciocabrera/lcabrera-stack/issues/1560) for (b), [#1567](https://github.com/luciocabrera/lcabrera-stack/issues/1567) for (c), [#1557](https://github.com/luciocabrera/lcabrera-stack/issues/1557) and [#1558](https://github.com/luciocabrera/lcabrera-stack/issues/1558) for (d), and [#1561](https://github.com/luciocabrera/lcabrera-stack/issues/1561), [#1562](https://github.com/luciocabrera/lcabrera-stack/issues/1562) and [#1563](https://github.com/luciocabrera/lcabrera-stack/issues/1563) for (e)
- [`render-a-small-read-only-table-that-sizes-to-its-rows`](../product/requirements/render-a-small-read-only-table-that-sizes-to-its-rows.md)
- [`docs/agents/cross-app-abstraction.md`](../agents/cross-app-abstraction.md)
