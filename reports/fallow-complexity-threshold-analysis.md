# Fallow Complexity Threshold Analysis

## Canonical Snapshot (2026-06-14)

Source of truth for this report:

- Command scope: apps/react-router
- Command: npx --yes fallow --format json --output-file /home/lucio/workspaces/vite-react-compiler/reports/fallow/fallow-full-latest.json --quiet
- JSON artifact: reports/fallow/fallow-full-latest.json

Current metrics from JSON:

- Functions above threshold: 21
- Functions analyzed: 3289
- Files analyzed: 1157
- Average maintainability: 93.1 (good)
- Dead-code issues: 5 (check.total_issues)
- Duplicate clone groups: 76 (dupes.stats.clone_groups)
- Severity split: 0 critical, 6 high, 15 moderate
- Thresholds: cyclomatic 20, cognitive 15, CRAP 30

## Interpretation

Use this report as triage guidance grounded on the current JSON snapshot. For planning and trend tracking, avoid terminal-parsed values and rely on the artifact above.

## Representative High-Severity Findings

- src/components/Table/contexts/TableData/data/actions/useFetchMoreData.hook.ts:31 (<anonymous>) - HIGH crap
- src/components/Table/contexts/FiltersData/filters/actions/useFetchFilterData.hook.ts:132 (<anonymous>) - HIGH crap
- src/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSectionContext/actions/useToggleColumnPin.hook.ts:31 (<anonymous>) - HIGH crap
- src/routes/enterprise-orders/order-detail/OrderDetail.component.tsx:211 (<anonymous>) - HIGH crap
- src/App.tsx:95 (<anonymous>) - HIGH crap
- src/routes/wide-alltypes-150/WideAlltypes150.constants.ts:16 (<anonymous>) - HIGH crap

## Drift Control

1. Run this script before updating planning docs.
2. Keep apps/react-router/docs/coordination/PROGRESS_TRACKER.md baseline aligned to this JSON snapshot.
3. Treat older threshold counts as historical context only.
