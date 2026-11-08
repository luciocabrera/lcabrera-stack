FALSE_POSITIVE

Evidence: I read the case file, `packages/ui/src/components/Heatmap/HeatmapGrid/HeatmapGrid.component.tsx`, `HeatmapGrid.stylex.ts`, `HeatmapGridRow/HeatmapGridRow.component.tsx`, `hooks/useHeatmapRovingFocus.hook.ts`, `utils/resolveHeatmapFocusMove.util.ts`, `Heatmap.test.tsx`, `biome.jsonc` (lines 378–407) and `packages/ui/src/PATTERNS.md` (lines 561–620).

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

Check: The finding would be real if the grid had no grid keyboard behaviour: no arrow-key handler on the table, no roving tab stop on the cells, or nothing focusable inside the cells. I looked in `packages/ui/src/components/Heatmap/hooks/useHeatmapRovingFocus.hook.ts`, `packages/ui/src/components/Heatmap/utils/resolveHeatmapFocusMove.util.ts`, `packages/ui/src/components/Heatmap/HeatmapGridRow/HeatmapGridRow.component.tsx`, `packages/ui/src/components/Heatmap/HeatmapGrid/HeatmapGrid.stylex.ts` and `packages/ui/src/components/Heatmap/Heatmap.test.tsx`. That gap is not there: all of that behaviour is implemented and tested.
