# Fallow Complexity Threshold Analysis

## Canonical Snapshot (2026-06-15)

Source of truth for this report:

- Command scope: apps/react-router
- Command: node node_modules/fallow/bin/fallow --format json --output-file /home/lucio/workspaces/vite-react-compiler/reports/fallow/fallow-full-latest.json --quiet
- JSON artifact: reports/fallow/fallow-full-latest.json

Current metrics from JSON:

- Functions above threshold: 26
- Functions analyzed: 3561
- Files analyzed: 1200
- Average maintainability: 93 (good)
- Dead-code issues: 0 (check.total_issues)
- Duplicate clone groups: 80 (dupes.stats.clone_groups)
- Severity split: 0 critical, 7 high, 19 moderate
- Thresholds: cyclomatic 20, cognitive 15, CRAP 30

## Interpretation

Use this report as triage guidance grounded on the current JSON snapshot. For planning and trend tracking, avoid terminal-parsed values and rely on the artifact above.

## Representative High-Severity Findings

- src/components/Table/contexts/TableData/data/actions/useFetchMoreData.hook.ts:31 (<anonymous>) - HIGH crap
- src/components/Table/contexts/FiltersData/filters/actions/useFetchFilterData.hook.ts:129 (<anonymous>) - HIGH crap
- src/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSectionContext/actions/useToggleColumnPin.hook.ts:31 (<anonymous>) - HIGH crap
- src/components/Table/contexts/TableConfig/meta/actions/useSetTableDrawersOpenState.hook.ts:11 (<anonymous>) - HIGH crap
- src/routes/enterprise-orders/order-detail/OrderDetail.component.tsx:211 (<anonymous>) - HIGH crap
- src/App.tsx:96 (<anonymous>) - HIGH crap
- src/routes/wide-alltypes-150/WideAlltypes150.constants.ts:16 (<anonymous>) - HIGH crap

## Drift Control

1. Run this script before updating planning docs.
2. Keep apps/react-router/docs/coordination/PROGRESS_TRACKER.md baseline aligned to this JSON snapshot.
3. Treat older threshold counts as historical context only.
