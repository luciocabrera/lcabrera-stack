# Draft: biome reports lint/a11y/noNoninteractiveElementToInteractiveRole on code it should not

> Not posted. Nothing here goes to the analyzer's tracker without the repository owner's explicit yes.

## The finding

```json
[
  {
    "severity": "error",
    "message": "The HTML element table is non-interactive and should not have an interactive role.",
    "category": "lint/a11y/noNoninteractiveElementToInteractiveRole",
    "location": {
      "path": "packages/ui/src/components/Heatmap/HeatmapGrid/HeatmapGrid.component.tsx",
      "start": {
        "line": 27,
        "column": 7
      },
      "end": {
        "line": 27,
        "column": 18
      }
    },
    "advices": []
  }
]
```

## The code

```
   17    const { gridProps, tabStop } = useHeatmapRovingFocus({
   18      firstLinked,
   19      linked,
   20    });
   21
   22    return (
   23      <table
   24        aria-describedby={descriptionId}
   25        aria-labelledby={titleId}
   26        {...gridProps}
   27        role='grid'
   28        {...stylex.props(heatmapGridStyles.table)}
   29      >
   30        <tbody>
   31          {rows.map((row, index) => (
   32            <HeatmapGridRow
   33              cells={row.cells}
   34              key={row.key}
   35              tabStopKey={index === tabStop.rowIndex ? tabStop.key : undefined}
   36            />
   37          ))}
```

## Why it is a false positive

### judge (claude-opus-5-5)

I read the case file, `packages/ui/src/components/Heatmap/HeatmapGrid/HeatmapGrid.component.tsx`, `HeatmapGrid.stylex.ts`, `HeatmapGridRow/HeatmapGridRow.component.tsx`, `hooks/useHeatmapRovingFocus.hook.ts`, `utils/resolveHeatmapFocusMove.util.ts`, `Heatmap.test.tsx`, `biome.jsonc` (lines 378–407) and `packages/ui/src/PATTERNS.md` (lines 561–620).

- **What the rule guards against:** a content element, like `<h1 role="button">`, that announces itself as a control but has none of a control's behaviour.
- **What this code does:** it uses `<table role="grid">`, the WAI-ARIA Authoring Practices data-grid markup. In ARIA, `grid` is a subclass of `table`, so this upgrades the table rather than turning content into a control.
- **The behaviour is there:**
  - The table gets `onKeyDown` and `onFocus` from `useHeatmapRovingFocus`.
  - The keydown handler works out the next cell through `resolveGridFocusKey`, the same resolver the Table grid uses, then calls `preventDefault` and moves focus.
  - Each linked cell is an `<a>` with a roving `tabIndex`: 0 on the single tab stop, -1 on the rest.
  - `Heatmap.test.tsx` (lines ~600–771) checks that the arrow keys move focus, that the tab stop moves with it, and that Enter, Tab and Alt+arrow are left alone.
- **The table's native role is intact:** `HeatmapGrid.stylex.ts` sets no `display`, so the `<table>` keeps its table semantics and `<td>`s count as grid cells.
- **The repo already ruled on this pattern:** `biome.jsonc` turns this rule off for `TableBase.component.tsx` with the same `<table role="grid">` reasoning. It notes that Biome's rule takes no options, so it can't carry the `table: ['grid']` allowance that jsx-a11y has by default. `PATTERNS.md` calls `role='grid'` on `<table>` a deliberate upgrade.
- **Side note:** Heatmap isn't in that `biome.jsonc` override yet, so the warning will keep firing until it is added or suppressed.

### judge (claude-sonnet-5-5)

- **Flagged code:** `HeatmapGrid.component.tsx:27` puts `role='grid'` on a `<table>`. Biome flags it because it treats `grid` as an interactive role and `table` as a non-interactive element.
- **Real grid behaviour:** The component is a working ARIA grid.
  - `useHeatmapRovingFocus` supplies `onKeyDown` through `gridProps`.
  - `HeatmapGridRow` sets `tabIndex={key === tabStopKey ? 0 : -1}` on the cells, which is roving focus.
  - The table is labelled by `aria-labelledby` and `aria-describedby`.
  - So this is not a static table dressed up with an interactive role. The rule exists to stop that.
- **Spec:** `table` with `role="grid"` is the WAI-ARIA Authoring Practices Guide's own markup for a data grid. ARIA also makes `grid` a subclass of `table`. `jsx-a11y` allows `table: ['grid']` by default. Biome's rule takes no options, so it can't be told about that allowance.
- **Repo decision:** `biome.jsonc` lines 378-407 already turn this rule off for `TableBase.component.tsx` and `TableBodyCell.component.tsx`. The comment there gives the reasoning above. It also records that switching to `<div>`s or dropping the roles was considered and rejected on merit. ADR-062 covers the grid semantics.
- **Remaining gap:** The `includes` list in that override doesn't cover `HeatmapGrid.component.tsx`, so the rule still fires here. That is a missing config entry, not a real accessibility defect.

### adversary (claude-fable-5-1)

`packages/ui/src/components/Heatmap/HeatmapGrid/HeatmapGrid.component.tsx:23-39` renders `<table role='grid'>` spreading `gridProps` from `hooks/useHeatmapRovingFocus.hook.ts`, which supplies `onFocus` (tracks the focused `data-heatmap-cell` key) and `onKeyDown` (resolves Arrow/Home/End/PageUp/PageDown and Ctrl/Cmd+Home/End via `resolveHeatmapFocusMove`, calls `preventDefault`, and moves `focus()` to the target `<a>`). `HeatmapGridRow/HeatmapGridRow.component.tsx:9-28` renders `<tr>`/`<td>` with a react-router `Link` per linked cell carrying `tabIndex` 0 on exactly the roving tab stop and -1 elsewhere. `Heatmap.test.tsx:594-773` exercises every grid keyboard convention (single tab stop, six key moves, modifier corners, skipping unlinked cells, scroll suppression, leaving Enter/Tab/Alt-arrow to the browser, focus following the mouse, tab-stop survival across data changes), and `Heatmap.test.tsx:699` queries `getByRole('grid', { name: 'Grid' })`. `HeatmapGrid.stylex.ts` sets no `display` on table, cell or row (only `position`, `inset`, `borderCollapse`, `tableLayout`, size), so the `<table>` keeps its implicit `table` role and `<tr>`/`<td>` keep implicit `row`/`gridcell` inside a `grid` per HTML-AAM — the explicit role is the ARIA-sanctioned upgrade of `table` to its interactive subclass, exactly the WAI-ARIA APG grid markup. `Heatmap.component.tsx:62-70` mounts the grid only when a linked cell exists, and `HeatmapPlot.component.tsx:24-28` then sets the SVG `aria-hidden` and drops its `role="img"`, so the table is the one accessible representation, named/described by `titleId`/`descriptionId`. The repository has already adjudicated this exact rule on the identical pattern as permanent: `biome.jsonc:378-407` turns `noNoninteractiveElementToInteractiveRole` off for `TableBase`/`TableBodyCell` because Biome's port takes no options (unlike jsx-a11y's default `table: ['grid']` allowance), and `docs/agents/public-package-suppressions.json:166-172` records the reasoning; the Heatmap file simply falls outside that `includes` glob. The rule's own documentation lists `button`, `link`, `checkbox`, `menuitem`, `option`, `radio`, `switch`, `textbox` etc. as the interactive roles it guards against converting content elements into; `grid` on `table` is a role-taxonomy refinement, not that conversion. Biome's two suggested fixes — render `<div>`s or drop the role — would respectively discard the native table fallback or re-expose the keyboard-navigable grid as a static table whose cells announce no grid semantics, making accessibility worse.
