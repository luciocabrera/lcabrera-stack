# Fallow Complexity Threshold Analysis

## Canonical Snapshot (2026-06-23)

Source of truth for this report:

- Command scope: apps/react-router
- Command: node node_modules/fallow/bin/fallow --format json --output-file /home/lucio/workspaces/vite-react-compiler/reports/fallow/full-latest.json --quiet
- JSON artifact: reports/fallow/full-latest.json

Current metrics from JSON:

- Functions above threshold: 17
- Functions analyzed: 3822
- Files analyzed: 1251
- Average maintainability: 93 (good)
- Dead-code issues: 30 (check.total_issues)
- Duplicate clone groups: 97 (dupes.stats.clone_groups)
- Severity split: 0 critical, 3 high, 14 moderate
- Thresholds: cyclomatic 20, cognitive 15, CRAP 30

## Interpretation

Use this report as triage guidance grounded on the current JSON snapshot. For planning and trend tracking, avoid terminal-parsed values and rely on the artifact above.

## Representative High-Severity Findings

- src/components/VirtualList/VirtualListBody/VirtualListBody.component.tsx:19 (<anonymous>) - HIGH cognitive
- src/components/Table/TableHeaderCell/TableHeaderCell.component.tsx:42 (<anonymous>) - HIGH cognitive
- src/components/VirtualSelect/VirtualSelect.component.tsx:19 (<anonymous>) - HIGH cognitive

## Drift Control

1. Run this script before updating planning docs.
2. Keep apps/react-router/docs/coordination/PROGRESS_TRACKER.md baseline aligned to this JSON snapshot.
3. Treat older threshold counts as historical context only.
