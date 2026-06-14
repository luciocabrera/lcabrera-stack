# Fallow Complexity Threshold Analysis

## Executive Summary

Fallow reports 55 functions above threshold, but this is not a broad "the codebase is too complex" result.

The strongest signals are:

- Average maintainability is 93.1 (`good`).
- The health score is 67.6 (`C`), but the biggest penalties come from `unused_deps` (11.5), `hotspots` (10.0), and `unit_size` (10.0), not complexity.
- Complexity penalties in the overall health score are `0.0` for both `complexity` and `p90_complexity`.
- 52 of the 55 findings are CRAP-only findings, not direct cyclomatic/cognitive threshold breaches.
- Only 3 findings exceed raw complexity thresholds directly: 2 `cognitive` only and 1 `both` cyclomatic and cognitive.

My read: Fallow is useful here as a triage tool, but the current threshold list is too noisy to treat as a hard fail signal by itself, especially while using static estimated coverage.

## What Fallow Reports

### Run Summary

- Tool version: `fallow 2.96.0`
- Files analyzed: 1215
- Functions analyzed: 3304
- Functions above threshold: 55
- Files scored: 726
- Average maintainability: 93.1
- Coverage model: `static_estimated`
- Coverage source consistency: `uniform`

### Thresholds in Effect

- Max cyclomatic threshold: 20
- Max cognitive threshold: 15
- Max CRAP threshold: 30.0

### Severity Breakdown

- Critical: 5
- High: 16
- Moderate: 34

### Why Functions Were Flagged

- `crap`: 52
- `cognitive`: 2
- `both`: 1

This is the most important fact in the report. The threshold list is overwhelmingly driven by CRAP scoring rather than by direct complexity limit breaches.

### Health Score Context

Overall health score:

- Score: 67.6
- Grade: `C`

Penalty breakdown:

- `dead_files`: 0.1
- `dead_exports`: 0.4
- `complexity`: 0.0
- `p90_complexity`: 0.0
- `maintainability`: 0.0
- `hotspots`: 10.0
- `unused_deps`: 11.5
- `circular_deps`: 0.0
- `unit_size`: 10.0
- `coupling`: 0.4
- `duplication`: 0.0

Takeaway: the repo's overall Fallow grade is not being dragged down by complexity findings directly.

## Distribution of the 55 Threshold Findings

### By Area

- `apps/react-router`: 33
- `packages`: 10
- `scripts`: 9
- `apps/admin_system`: 1
- `apps/api-server`: 1
- `apps/api-server-fast`: 1

### Table-Specific Concentration

- Table-related: 16
- Non-table: 39

This matters because the current concern started in the table area, but the threshold set is broader than that.

### Test vs Production Code

- Production findings: 55
- Test findings: 0

So the 55 above-threshold functions are not caused by test helpers inflating the result.

### Shape of the Flagged Functions

Median values across the 55 findings:

- Median cyclomatic: 9
- Median cognitive: 6
- Median line count: 38

Additional counts:

- Functions with cyclomatic >= 15: 9
- Functions with cognitive >= 12: 10
- Functions with line count > 60: 13

This supports the idea that many flagged items are not extreme raw-complexity outliers. A lot of them are medium-sized functions with enough branching plus weak estimated coverage to trip CRAP.

## Highest-Priority Findings

### Direct Raw Complexity Breaches

These are the least arguable findings because they exceed raw complexity thresholds without depending only on CRAP:

| File                                                                                                     | Symbol                 | Cyclomatic | Cognitive | LOC | Exceeded  |
| -------------------------------------------------------------------------------------------------------- | ---------------------- | ---------: | --------: | --: | --------- |
| `apps/react-router/src/components/Table/TableBodyCell/TableBodyCell.component.tsx`                       | `TableBodyCell`        |         21 |        17 |  70 | both      |
| `apps/react-router/src/components/VirtualSelect/VirtualSelectTrigger/VirtualSelectTrigger.component.tsx` | `VirtualSelectTrigger` |         16 |        16 | 128 | cognitive |
| `apps/react-router/src/utils/performance/useRenderTracker.hook.ts`                                       | `useRenderTracker`     |          9 |        16 |  50 | cognitive |

If you want a truly focused complexity cleanup list, start here.

### Critical Severity Findings

These are the 5 CRAP-critical functions from the current report:

| File                                                                                    | Symbol                   | Cyclomatic | Cognitive | LOC |
| --------------------------------------------------------------------------------------- | ------------------------ | ---------: | --------: | --: |
| `packages/eslint-local-rules/single-component-export.ts`                                | `ExportNamedDeclaration` |         13 |        11 |  21 |
| `apps/react-router/src/routes/enterprise-orders/enterprise-orders.loader.ts`            | `loader`                 |         13 |         8 |  83 |
| `apps/react-router/src/routes/enterprise-orders/order-detail/OrderDetail.component.tsx` | `formatValue`            |         11 |        10 |  33 |
| `apps/react-router/src/routes/wide-alltypes-150/wide-alltypes-150.loader.ts`            | `loader`                 |         11 |         6 |  51 |
| `packages/eslint-local-rules/destructuring-for-functions.ts`                            | `isArrayMethodCallback`  |         10 |         8 |  38 |

### Notable Concentration Clusters

The threshold list clusters in a few places:

- `apps/react-router/src/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSectionContext`: 5 findings
- `apps/react-router/src/components/Table/contexts/TableConfig/columns`: 5 findings
- `apps/react-router/src/routes/enterprise-orders/order-detail/OrderDetail.component.tsx`: 3 findings
- `apps/react-router/src/components/Table/contexts/FiltersData/filters`: 2 findings
- `scripts/validate-skills.cjs`: multiple high-severity findings

These are good candidates for slice-by-slice refactors because they offer more payoff than chasing isolated medium findings.

## Interpretation

## 1. Fallow is not saying the whole codebase has dangerous complexity

The repo's average maintainability is high, complexity penalties are zeroed in the health score, and the number of raw threshold breaches is very small.

## 2. The 55-count is mostly a CRAP/coverage signal

Because 52 of 55 are `crap` findings, the list is heavily influenced by the interaction between branching and coverage assumptions.

That matters more here because the coverage model is `static_estimated`, not measured test coverage. Static estimation is fine for broad trends, but it is a weaker signal for turning individual functions into hard failures.

## 3. The report still surfaces useful refactor targets

The list is not useless noise. It highlights real clusters:

- Table pinning/order conflict handlers
- enterprise order loaders and detail formatting logic
- script utilities with parser/validator branching
- custom ESLint rules with AST branching

Those are valid refactor candidates, just not evidence that the threshold should be treated as a strict global gate.

## Recommendation on Strictness

Recommended policy:

- Keep Fallow complexity reporting enabled.
- Do not treat the current `55 above threshold` count as a hard pass/fail gate for the whole repo.
- Prioritize the 3 direct raw complexity breaches first.
- Triage critical/high CRAP findings second, especially where they cluster.
- Reassess strictness only after using measured coverage or narrowing scope to changed files.

### Practical Gate Recommendation

A more reliable policy would be:

1. Fail only on raw threshold breaches:
   - `cognitive`
   - `cyclomatic`
   - `both`
2. Keep `crap` findings as warning-level unless they are also critical severity and in production paths you actively maintain.
3. Run `fallow audit` or changed-file-only checks in CI for branch gating instead of repo-wide threshold counts.
4. Consider separate expectations for:
   - app runtime code
   - scripts
   - AST-heavy ESLint rule packages

### Why I Would Not Simply Raise the Threshold Globally

Raising thresholds globally would hide the 3 strongest findings and some legitimate refactor targets.

The problem is not that Fallow is entirely wrong. The problem is that a repo-wide CRAP threshold based on static estimated coverage is mixing together:

- genuinely complex UI/state logic
- parser/AST utilities that naturally branch more
- scripts that are important but not on the main runtime path

So I would change policy before changing the numeric thresholds.

## Suggested Next Actions

1. Fix or split the 3 raw complexity threshold breaches first.
2. Pick one cluster to simplify next:
   - `TableSettingsDrawer/ColumnOrderSection/ColumnOrderSectionContext`
   - `TableConfig/columns`
   - `enterprise-orders`
3. Move repo-wide CRAP findings to a backlog report instead of a failing gate.
4. If desired, add a small script that converts the sanitized Fallow JSON into a stable markdown summary so future runs are repeatable.

## Notes on Data Quality

The JSON artifact from `npx fallow health --complexity-breakdown --format json` was contaminated by the `npx` install prompt at the beginning of the file and the terminal prompt at the end of the file. The analysis above was produced from the sanitized JSON payload, not from the wrapped terminal text output.
