# Fallow Complexity Threshold Analysis

## Canonical Snapshot (2026-07-06)

Source of truth for this report:

- Command scope: entire monorepo (root .fallowrc.json)
- Command: node node_modules/fallow/bin/fallow --format json --output-file /home/lucio/workspaces/vite-react-compiler/reports/fallow/full-latest.json --quiet
- JSON artifact: reports/fallow/full-latest.json

Current metrics from JSON:

- Functions above threshold: 57
- Functions analyzed: 5438
- Files analyzed: 1908
- Average maintainability: 93.1 (good)
- Dead-code issues: 86 (check.total_issues)
- Duplicate clone groups: 15 (dupes.stats.clone_groups)
- Severity split: 8 critical, 5 high, 44 moderate
- Thresholds: cyclomatic 20, cognitive 15, CRAP 30

## Interpretation

Use this report as triage guidance grounded on the current JSON snapshot. For planning and trend tracking, avoid terminal-parsed values and rely on the artifact above.

## Top High-Severity Findings (limit: 20 — rerun with --top=N for more)

- scripts/refresh-fallow-complexity-report.cjs:193 (<anonymous>) - CRITICAL all
- packages/vite-configs/eslint.custom-rules.shared.config.mjs:22 (<anonymous>) - CRITICAL crap
- packages/vite-configs/eslint.custom-rules.shared.config.mjs:88 (<anonymous>) - CRITICAL crap
- packages/eslint-local-rules/single-component-export.ts:33 (<anonymous>) - CRITICAL crap
- .github/skills/linter-checker/scripts/generate-linter-report.mjs:260 (<anonymous>) - CRITICAL crap
- .github/skills/linter-checker/scripts/generate-linter-report.mjs:374 (<anonymous>) - CRITICAL crap
- .github/skills/linter-checker/scripts/generate-linter-report.mjs:187 (<anonymous>) - CRITICAL crap
- packages/eslint-local-rules/destructuring-for-functions.ts:61 (<anonymous>) - CRITICAL crap
- packages/scan-ingestion/src/cli/ingest.cli.ts:47 (<anonymous>) - HIGH crap
- scripts/seed-db.cjs:113 (<anonymous>) - HIGH crap
- packages/ui/src/components/Table/contexts/TableConfig/columns/actions/useBatchSetColumnSettings.hook.ts:19 (<anonymous>) - HIGH crap
- apps/admin_system/src/routes/cqms/edit-project/editProject.action.ts:9 (<anonymous>) - HIGH crap
- packages/vite-configs/vite.plugins.shared.config.ts:104 (<anonymous>) - HIGH crap

## Drift Control

1. Run this script before updating planning docs.
2. Never copy these numbers into other docs — reference the canonical artifacts in reports/fallow/ instead (single source of truth).
3. Treat older threshold counts as historical context only.
