# Fallow Complexity Threshold Analysis

## Canonical Snapshot (2026-07-11)

Source of truth for this report:

- Command scope: entire monorepo (root .fallowrc.json)
- Command: node node_modules/fallow/bin/fallow --format json --output-file /home/lucio/workspace/vite-react-compiler/reports/fallow/full-latest.json --quiet
- JSON artifact: reports/fallow/full-latest.json

Current metrics from JSON:

- Functions above threshold: 92
- Functions analyzed: 6548
- Files analyzed: 2324
- Average maintainability: 93.2 (good)
- Dead-code issues: 130 (check.total_issues)
- Duplicate clone groups: 26 (dupes.stats.clone_groups)
- Severity split: 19 critical, 20 high, 53 moderate
- Thresholds: cyclomatic 20, cognitive 15, CRAP 30

## Interpretation

Use this report as triage guidance grounded on the current JSON snapshot. For planning and trend tracking, avoid terminal-parsed values and rely on the artifact above.

## Top High-Severity Findings (limit: 20 — rerun with --top=N for more)

- apps/admin_system/src/routes/cqms/new-scanner/newScanner.action.ts:11 (<anonymous>) - CRITICAL all
- scripts/refresh-fallow-complexity-report.cjs:193 (<anonymous>) - CRITICAL all
- apps/admin_system/src/routes/cqms/edit-scanner/editScanner.action.ts:16 (<anonymous>) - CRITICAL all
- packages/vite-configs/eslint.custom-rules.shared.config.mjs:22 (<anonymous>) - CRITICAL crap
- packages/vite-configs/eslint.custom-rules.shared.config.mjs:88 (<anonymous>) - CRITICAL crap
- packages/scan-ingestion/src/ingestion/fallow/extractFallowRunSummary.util.ts:16 (<anonymous>) - CRITICAL all
- packages/eslint-local-rules/single-component-export.ts:20 (<anonymous>) - CRITICAL crap
- apps/admin_system/src/routes/cqms/edit-user/editUser.action.ts:17 (<anonymous>) - CRITICAL crap
- apps/admin_system/src/routes/cqms/project-detail/projectDetail.action.ts:22 (<anonymous>) - CRITICAL crap
- .github/skills/fallow-code-checker/scripts/generate-fallow-report.mjs:227 (<anonymous>) - CRITICAL crap
- .github/skills/linter-checker/scripts/lint-report-shared.mjs:83 (<anonymous>) - CRITICAL crap
- apps/admin_system/src/routes/cqms/trigger-scan/triggerScan.action.ts:17 (<anonymous>) - CRITICAL crap
- apps/admin_system/src/routes/cqms/new-user/newUser.action.ts:9 (<anonymous>) - CRITICAL crap
- .github/skills/fallow-code-checker/scripts/generate-fallow-report.mjs:162 (<anonymous>) - CRITICAL crap
- apps/admin_system/src/routes/cqms/scanner-detail/ScannerDetail.component.tsx:14 (<anonymous>) - CRITICAL crap
- .github/skills/linter-checker/scripts/generate-oxlint-report.mjs:67 (<anonymous>) - CRITICAL crap
- .github/skills/fallow-code-checker/scripts/generate-fallow-report.mjs:73 (<anonymous>) - CRITICAL crap
- .github/skills/fallow-code-checker/scripts/generate-fallow-report.mjs:242 (<anonymous>) - CRITICAL crap
- apps/admin_system/src/routes/cqms/edit-role/editRole.action.ts:16 (<anonymous>) - CRITICAL crap
- apps/admin_system/src/routes/cqms/edit-project/editProject.action.ts:14 (<anonymous>) - HIGH crap

## Drift Control

1. Run this script before updating planning docs.
2. Never copy these numbers into other docs — reference the canonical artifacts in reports/fallow/ instead (single source of truth).
3. Treat older threshold counts as historical context only.
