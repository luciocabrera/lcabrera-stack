FALSE_POSITIVE
Evidence:

- **Flagged code:** `HeatmapGrid.component.tsx:27` puts `role='grid'` on a `<table>`. Biome flags it because it treats `grid` as an interactive role and `table` as a non-interactive element.
- **Real grid behaviour:** The component is a working ARIA grid.
  - `useHeatmapRovingFocus` supplies `onKeyDown` through `gridProps`.
  - `HeatmapGridRow` sets `tabIndex={key === tabStopKey ? 0 : -1}` on the cells, which is roving focus.
  - The table is labelled by `aria-labelledby` and `aria-describedby`.
  - So this is not a static table dressed up with an interactive role. The rule exists to stop that.
- **Spec:** `table` with `role="grid"` is the WAI-ARIA Authoring Practices Guide's own markup for a data grid. ARIA also makes `grid` a subclass of `table`. `jsx-a11y` allows `table: ['grid']` by default. Biome's rule takes no options, so it can't be told about that allowance.
- **Repo decision:** `biome.jsonc` lines 378-407 already turn this rule off for `TableBase.component.tsx` and `TableBodyCell.component.tsx`. The comment there gives the reasoning above. It also records that switching to `<div>`s or dropping the roles was considered and rejected on merit. ADR-062 covers the grid semantics.
- **Remaining gap:** The `includes` list in that override doesn't cover `HeatmapGrid.component.tsx`, so the rule still fires here. That is a missing config entry, not a real accessibility defect.

Check: The finding would be real if the `<table>` had `role="grid"` but no grid behaviour (no roving focus, no key handling, no focusable cells), or if the role were a truly interactive one such as `button` or `link`. I searched `packages/ui/src/components/Heatmap/` for `role`, `tabIndex`, `onKeyDown` and `gridProps`. I found the hook `hooks/useHeatmapRovingFocus.hook.ts` (which supplies `onKeyDown`), `HeatmapGridRow/HeatmapGridRow.component.tsx` (which sets roving `tabIndex`), and `HeatmapGrid.component.tsx`. Neither condition is present. I also checked `biome.jsonc` and the ADRs, which already treat the same pattern as accepted.
