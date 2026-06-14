# Fallow Complexity Threshold Analysis

## Canonical Snapshot (2026-06-14)

Source of truth for this report:

- Command scope: apps/react-router
- Command: npx --yes fallow --format json --output-file /home/lucio/workspaces/vite-react-compiler/reports/fallow/fallow-full-latest.json --quiet
- JSON artifact: reports/fallow/fallow-full-latest.json

Current metrics from JSON:

- Functions above threshold: 28
- Functions analyzed: 3078
- Files analyzed: 1122
- Average maintainability: 93 (good)
- Dead-code issues: 6 (check.total_issues)
- Duplicate clone groups: 67 (dupes.stats.clone_groups)
- Severity split: 3 critical, 9 high, 16 moderate
- Thresholds: cyclomatic 20, cognitive 15, CRAP 30

## Interpretation

Use this report as triage guidance grounded on the current JSON snapshot. For planning and trend tracking, avoid terminal-parsed values and rely on the artifact above.

## Representative High-Severity Findings

- src/routes/enterprise-orders/enterprise-orders.loader.ts:27 (<anonymous>) - CRITICAL crap
- src/routes/enterprise-orders/order-detail/OrderDetail.component.tsx:113 (<anonymous>) - CRITICAL crap
- src/routes/wide-alltypes-150/wide-alltypes-150.loader.ts:16 (<anonymous>) - CRITICAL crap
- src/components/Table/contexts/TableData/data/actions/useFetchMoreData.hook.ts:27 (<anonymous>) - HIGH crap
- src/routes/enterprise-orders/order-detail/OrderDetail.component.tsx:89 (<anonymous>) - HIGH crap
- src/components/Table/contexts/FiltersData/filters/actions/useFetchFilterData.hook.ts:126 (<anonymous>) - HIGH crap
- src/utils/urlState/serializeFiltersToURL.util.ts:8 (<anonymous>) - HIGH crap
- src/components/Table/contexts/FiltersData/filters/actions/useFetchFilterData.hook.ts:47 (<anonymous>) - HIGH crap

## Drift Control

1. Run this script before updating planning docs.
2. Keep apps/react-router/docs/coordination/PROGRESS_TRACKER.md baseline aligned to this JSON snapshot.
3. Treat older threshold counts as historical context only.
