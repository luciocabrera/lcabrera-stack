# Fallow Monorepo Baseline Report

## Metadata

- Date: 2026-07-06
- Scope: entire monorepo (15 workspaces, root `.fallowrc.json`)
- Fallow: 3.0.0 · gate: `new-only` · thresholds: cyclomatic 20 / cognitive 15 / CRAP 30
- Sources: `full-latest.json`, `dead-code-latest.json`, `health-latest.json`, `dupes-latest.json` (this directory)
- Baselines captured: `baselines/{dead-code,health,dupes}.json` — this inherited debt is excluded from the CI audit gate; only regressions fail PRs.

## Executive summary

**Health score: 77.6 / 100 (grade B).** First full-monorepo scan after hoisting fallow from `apps/react-router` to the root. The react-router app itself is clean (0 dead-code issues — its prior fallow coverage paid off). Nearly all findings are in the **newly-covered workspaces**: the two API servers, `packages/ui`'s Form component family, and `apps/admin_system`.

Totals: **83 dead-code issues** (9 unused files, 6 unused export groups, 62 unused types, 2 misplaced dependencies, 1 unlisted dependency, 3 circular dependencies) · **57 functions above complexity thresholds** (8 critical / 5 high / 44 moderate) · **15 clone groups** (1.2% duplication — low).

Score penalties are dominated by `hotspots` (10) and `unit_size` (10); dead code and duplication barely register. The fastest score gains come from breaking the `packages/ui` Form import cycles and decomposing the hotspot files listed below.

## Prioritized queue

### P1 — structural risk (breaks change-cascades; enables deletion)

1. **Circular dependencies in `packages/ui` Form family (3 cycles, rule severity: error).**
   `FormFieldGroup` / `FormFieldRow` / `FormFieldTabs` each import from `FormFields.component.tsx`, which imports them back. Fallow's own refactor-target ranking puts all four files at the top (priority 26.5–12.2, recommendation: "Break import cycle to reduce change cascade"). Fix: move the shared types/helpers the children need out of `FormFields.component.tsx` into a leaf module (e.g. `FormFields.types.ts`), imports point downward only. Verify: `vp run fallow:dead-code` reports 0 circular deps; `vp check` + UI tests green.
2. **Misplaced dependencies in `apps/admin_system/package.json`**: `@repo/data-access` and `@stylexjs/stylex` are declared but only used by other workspaces (react-router, scan-orchestrator, scan-ingestion, packages/ui). Fix: remove from admin_system (fallow action: move-dependency; already declared where actually used). Verify: `vp run build:all`.
3. **Unlisted dependency `vite-plus`** imported by `apps/api-server`, `apps/api-server-fast`, and `apps/shared` `vite.config.ts` files without being declared in their package.json (resolves only through hoisting). Fix: add `"vite-plus": "catalog:"` to devDependencies of those three workspaces. Verify: `vp install && vp run build:all`.

### P2 — dead code in newly-covered workspaces (deletion candidates)

4. **9 unused files** — all in the API servers and packages/ui barrels:
   - `apps/api-server{,-fast}/src/constants/server.constants.ts`, `src/features/carSales/carSales.types.ts`, `src/types/api.types.ts` (both servers), plus `apps/api-server-fast/src/errors/httpError.ts`
   - `packages/ui/src/components/Form/FormBody/index.ts`, `packages/ui/src/components/Form/fields/PathField/index.ts` (orphaned barrels)
     The api-server/api-server-fast pairs are copy-paste twins — delete together. Verify each batch with `vp run fallow:dead-code` + `vp run build:all` + API smoke test.
5. **62 unused types**, concentrated in:
   - `packages/ui/src/components/Form/index.ts` — 18 unused type re-exports (tied to the Form barrel cleanup in P1)
   - `apps/api-server-fast/.../enterpriseOrders.types.ts` (9) and `apps/api-server/.../enterpriseOrders.types.ts` (8)
     Most are removable with `fallow fix` (auto-fix for unused exports/types) after P1 lands; rule severity is `warn`, so no CI pressure — batch it.
6. **6 unused export groups** in API-server constants files, `apps/scan-orchestrator/src/config/env.schema.ts`, and `packages/scan-ingestion/src/ingestion/report.schema.ts`.

### P3 — complexity and hotspots (refactor when touched)

7. **8 critical-CRAP functions** (all in tooling, none in product runtime):
   - `scripts/refresh-fallow-complexity-report.cjs:193` (cyc 26, CRAP 702 — the report-template function; ironic but real)
   - `packages/vite-configs/eslint.custom-rules.shared.config.mjs:22,88` (CRAP 240/210)
   - `packages/eslint-local-rules/single-component-export.ts:33` (182), `destructuring-for-functions.ts:61` (110)
   - `.github/skills/linter-checker/scripts/generate-linter-report.mjs:187,260,374` (132–156)
     These are untested tooling scripts — CRAP is high because coverage is zero. Either add focused tests or decompose; they only matter when edited (the audit gate will flag regressions).
8. **5 high findings** include one product-code item worth attention: `packages/ui/.../useBatchSetColumnSettings.hook.ts:19` (cyclomatic 16). The rest are tooling/scripts and one admin_system action (`editProject.action.ts:9`).
9. **Churn hotspots** (top): `EnterpriseOrders.component.tsx` (score 63.5, 11 commits), `eslint.custom-rules.shared.config.mjs` (48.0), `refresh-fallow-complexity-report.cjs` (40.2), `CarSales.component.tsx` (38.4). High churn × complexity — prefer these when scheduling refactors.

### P3 — duplication (1.2%, low; extract when convenient)

Representative clone families (15 groups, 35 instances, 508 duplicated lines):

- **React-router loaders**: `car-sales`, `car-sales-infinite`, `enterprise-orders`, `wide-alltypes-150` share two clone groups (29 lines ×3, 22 lines ×4) — extract a shared loader helper (continues the WS-009 pattern from the app's earlier cleanup).
- **API servers**: `apps/api-server/src/server.ts` ↔ `apps/api-server-fast/src/server.ts` (20 lines) and ↔ `apps/scan-orchestrator/src/server.ts` (18 lines) — shared server-bootstrap util candidate in `apps/shared` or `packages/utils`.
- **admin_system actions**: `editProject.action.ts` ↔ `newProject.action.ts` (22 lines) — extract shared project-form validation/mapping.
- Same-file clones in `Toolbar.examples.tsx` (36 lines) and `SelectOption.component.tsx` (18) — extract local helpers, lowest priority.

## False positives resolved during this scan

Config now declares these as entry points (they're invoked externally, not imported):

- `.github/skills/*/scripts/*.{js,mjs,cjs}` — skill runner scripts
- `packages/scan-ingestion/src/cli/**/*.ts` — CQMS ingest CLI (run via `node --experimental-strip-types`)
- `apps/*/scripts/**` — per-app operational scripts (e.g. `api-server-fast/scripts/smoke-test.js`)

This removed 3 phantom "unused files" (86 → 83 total issues).

## Comparison note (react-router)

The pre-hoist app-scoped scan reported 1 issue (an unresolved import) on 3,822 "functions" — a figure inflated by generated content (`.react-router/`, `build/`, coverage). Under the root config with proper ignorePatterns the app is 95 files / ~135 functions and reports **0 issues**: the unresolved import resolves now that fallow sees the whole workspace graph.

## Next steps

1. Land P1 (cycles + dependency placement) — biggest structural win, unblocks the Form barrel cleanup.
2. Batch-delete P2 dead code with `fallow fix` + manual review, one workspace at a time (API servers first: they're twins, so learnings transfer).
3. After each batch: `vp run fallow:refresh-report` and re-save baselines so the CI gate tracks the improved floor:
   `npx fallow dead-code --save-baseline reports/fallow/baselines/dead-code.json` (same for `health`/`dupes`).
4. Re-check the score trend with `npx fallow health --trend` (snapshot saved this run).
5. Optional follow-ups noted in the adoption plan: drop `knip` from react-router (redundant with fallow), consider a `--min-score` CI gate once the trend stabilizes.
