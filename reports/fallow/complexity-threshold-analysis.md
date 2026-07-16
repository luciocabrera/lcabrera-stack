# Fallow Complexity Threshold Analysis

## Canonical Snapshot (2026-07-16)

Source of truth for this report:

- Command scope: entire monorepo (root .fallowrc.json)
- Command: node node_modules/fallow/bin/fallow --format json --output-file /home/lucio/workspace/vite-react-compiler/reports/fallow/full-latest.json --quiet
- JSON artifact: reports/fallow/full-latest.json

Current metrics from JSON:

- Functions above threshold: 28
- Functions analyzed: 8532
- Files analyzed: 2829
- Average maintainability: 93.2 (good)
- Dead-code issues: 36 (check.total_issues)
- Duplicate clone groups: 16 (dupes.stats.clone_groups)
- Severity split: 5 critical, 5 high, 18 moderate
- Thresholds: cyclomatic 20, cognitive 15, CRAP 30

## Interpretation

Use this report as triage guidance grounded on the current JSON snapshot. For planning and trend tracking, avoid terminal-parsed values and rely on the artifact above.

## Top High-Severity Findings (limit: 20 — rerun with --top=N for more)

- scripts/refresh-fallow-complexity-report.cjs:193 (<anonymous>) - CRITICAL all
- packages/vite-configs/eslint.custom-rules.shared.config.mjs:138 (<anonymous>) - CRITICAL crap
- packages/vite-configs/eslint.custom-rules.shared.config.mjs:22 (<anonymous>) - CRITICAL crap
- apps/admin_system/src/routes/cqms/account-tokens/AccountTokens.component.tsx:10 (<anonymous>) - CRITICAL crap
- packages/scan-ingestion/src/cli/ingest.cli.ts:38 (<anonymous>) - CRITICAL crap
- apps/admin_system/src/routes/cqms/project-detail/ProjectSyncPanel/ProjectSyncPanel.component.tsx:26 (<anonymous>) - HIGH crap
- scripts/seed-db.cjs:113 (<anonymous>) - HIGH crap
- packages/scan-ingestion/src/cli/push.cli.ts:24 (<anonymous>) - HIGH crap
- packages/scan-ingestion/src/ingestion/fallow/extractFallowFunctionFindings.util.ts:23 (<anonymous>) - HIGH crap
- packages/vite-configs/vite.plugins.shared.config.ts:105 (<anonymous>) - HIGH crap

## Drift Control

1. Run this script before updating planning docs.
2. Never copy these numbers into other docs — reference the canonical artifacts in reports/fallow/ instead (single source of truth).
3. Treat older threshold counts as historical context only.
