# Fallow Complexity Threshold Analysis

## Canonical Snapshot (2026-06-17)

Source of truth for this report:

- Command scope: apps/react-router
- Command: node node_modules/fallow/bin/fallow --format json --output-file /home/lucio/workspaces/vite-react-compiler/reports/fallow/fallow-full-latest.json --quiet
- JSON artifact: reports/fallow/fallow-full-latest.json

Current metrics from JSON:

- Functions above threshold: 31
- Functions analyzed: 3859
- Files analyzed: 1230
- Average maintainability: 93 (good)
- Dead-code issues: 17 (check.total_issues)
- Duplicate clone groups: 92 (dupes.stats.clone_groups)
- Severity split: 6 critical, 4 high, 21 moderate
- Thresholds: cyclomatic 20, cognitive 15, CRAP 30

## Interpretation

Use this report as triage guidance grounded on the current JSON snapshot. For planning and trend tracking, avoid terminal-parsed values and rely on the artifact above.

## Representative High-Severity Findings

- src/components/VirtualList/VirtualList.component.tsx:24 (<anonymous>) - CRITICAL both
- src/components/Table/TableHeaderCell/TableHeaderCell.component.tsx:44 (<anonymous>) - CRITICAL cognitive
- src/components/AppNavigation/AppNavigation.component.tsx:140 (<anonymous>) - CRITICAL cognitive
- src/components/Table/ColumnSettingsDrawer/GeneralSection/GeneralSection.component.tsx:30 (<anonymous>) - CRITICAL cognitive
- src/components/Table/TableSettingsDrawer/GeneralSettingsSection/GeneralSettingsSection.component.tsx:35 (<anonymous>) - CRITICAL cognitive
- src/components/Table/TableContent/TableContent.component.tsx:27 (<anonymous>) - CRITICAL cognitive
- src/components/Table/TableSettingsDrawer/FiltersSection/FiltersSectionToolbar/FiltersSectionToolbar.component.tsx:28 (<anonymous>) - HIGH cognitive
- src/components/VirtualSelect/VirtualSelect.component.tsx:19 (<anonymous>) - HIGH cognitive

## Drift Control

1. Run this script before updating planning docs.
2. Keep apps/react-router/docs/coordination/PROGRESS_TRACKER.md baseline aligned to this JSON snapshot.
3. Treat older threshold counts as historical context only.
