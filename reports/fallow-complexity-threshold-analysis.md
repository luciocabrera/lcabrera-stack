# Fallow Complexity Threshold Analysis

## Canonical Snapshot (2026-06-16)

Source of truth for this report:

- Command scope: apps/react-router
- Command: node node_modules/fallow/bin/fallow --format json --output-file /home/lucio/workspaces/vite-react-compiler/reports/fallow/fallow-full-latest.json --quiet
- JSON artifact: reports/fallow/fallow-full-latest.json

Current metrics from JSON:

- Functions above threshold: 19
- Functions analyzed: 3773
- Files analyzed: 1219
- Average maintainability: 93 (good)
- Dead-code issues: 21 (check.total_issues)
- Duplicate clone groups: 89 (dupes.stats.clone_groups)
- Severity split: 0 critical, 0 high, 19 moderate
- Thresholds: cyclomatic 20, cognitive 15, CRAP 30

## Interpretation

Use this report as triage guidance grounded on the current JSON snapshot. For planning and trend tracking, avoid terminal-parsed values and rely on the artifact above.

## Representative High-Severity Findings

- No critical/high findings in current snapshot.

## Drift Control

1. Run this script before updating planning docs.
2. Keep apps/react-router/docs/coordination/PROGRESS_TRACKER.md baseline aligned to this JSON snapshot.
3. Treat older threshold counts as historical context only.
