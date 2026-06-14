# Fallow Quality Progress Tracker

Last updated: 2026-06-14
Project: apps/react-router

## Current Baseline

- Fallow full (`vp run fallow:full`): 21 above threshold · maintainability 93.1 (good) · 3223 analyzed
- Fallow dead-code: 2 issues reported by fallow
- Fallow dupes: 73 clone groups
- Canonical machine-readable source: `reports/fallow/fallow-full-latest.json`
- Analysis source doc: `reports/fallow-complexity-threshold-analysis.md`
- Quality gate: `vp check` passes (format + lint + type)
- Worktree status: active (see current `git status --short`)

## Goals

- Continue safe duplicate reduction in small batches
- Keep runtime behavior stable after each batch
- Keep `vp check` green after every merge

## Workstream Board

| ID     | Area                                                                           | Priority | Risk   | Owner   | Status    | Notes                                                                                                                                                               |
| ------ | ------------------------------------------------------------------------------ | -------- | ------ | ------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WS-001 | TableConfig action hook tests (`dup:be74d40d`, `dup:41849296`, `dup:02c63426`) | P3       | Low    | Copilot | Completed | Shared test scaffold adopted in top duplicate tests                                                                                                                 |
| WS-002 | Theme tokens (`dup:a93fd860`)                                                  | P3       | Medium | Copilot | Rejected  | Factory approach created new patterns; inherent to StyleX themes                                                                                                    |
| WS-003 | Wide dataset service self-duplication (`dup:fab3a5ee`)                         | P3       | Medium | Copilot | Deferred  | 150-column repeating pattern; inherent structural duplication                                                                                                       |
| WS-004 | Route constants overlap (`dup:98d61efa`)                                       | P3       | Low    | Copilot | Completed | Consolidate common column constants carefully                                                                                                                       |
| WS-005 | Table drawer/context test scaffolds (`dup:d04c3ee1`)                           | P3       | Low    | Copilot | Completed | Similar test harnesses; extract shared util                                                                                                                         |
| WS-006 | TableConfig pinning action cluster complexity                                  | P1       | Medium | Copilot | Completed | Pinning hooks fully factored; 0 CRAP violations; dead barrel export removed                                                                                         |
| WS-007 | ColumnOrderSection conflict action cluster complexity                          | P1       | Medium | Copilot | Completed | Wrote dispatch tests for 5 hooks (useToggleColumnPin, useAcceptPinSide, useAcceptUnpinConflict, useAcceptPinConflict, useOrderBySorting); shared mock factory added |
| WS-008 | URL/filter serialization complexity hotspots                                   | P2       | Medium | Copilot | Completed | Refactored filter serialization + fetch hooks with helper decomposition; preserved behavior and passed full gate                                                    |
| WS-009 | Route loader complexity (`enterprise-orders`, `wide-alltypes-150`)             | P2       | Medium | Copilot | Completed | Reused shared `readTableLoaderStateFromRequest` to remove duplicate parsing logic                                                                                   |
| WS-010 | Enterprise order detail formatting/status complexity                           | P2       | Low    | Copilot | Completed | Replaced branch-heavy status/formatting logic with lookup + focused formatter helpers                                                                               |

## Batch Log

| Date       | Batch | Changes                                                                                                                                                                                                 | Validation                                                                                   | Result    |
| ---------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | --------- |
| 2026-06-11 | B-001 | Introduced shared test store utility + deduped EnterpriseOrders distinct string columns                                                                                                                 | Focused tests + `vp check` + fallow dupes                                                    | Completed |
| 2026-06-11 | B-002 | Added coordination docs for parallel agent execution                                                                                                                                                    | `vp check` baseline captured                                                                 | Completed |
| 2026-06-11 | B-003 | Claimed WS-001/WS-004; extracted TableConfig action test scaffold + expanded EnterpriseOrders basic-column helper usage                                                                                 | Focused action tests + `vp check` + fallow dupes check                                       | Completed |
| 2026-06-11 | B-004 | Claimed WS-005; migrated drawer/context tests to shared createMockStore utility                                                                                                                         | Focused drawer/data tests + `vp check` + fallow dupes                                        | Completed |
| 2026-06-11 | B-005 | Attempted WS-002 theme token extraction; reverted when factory approach increased duplication (414 → 416)                                                                                               | `vp check` + fallow dupes analysis                                                           | Rejected  |
| 2026-06-11 | B-004 | Claimed WS-005; migrated drawer/context tests to shared createMockStore utility                                                                                                                         | Focused drawer/data tests + `vp check` + fallow dupes                                        | Completed |
| 2026-06-14 | B-006 | Revalidated complexity baseline with project command and reconciled reported mismatch                                                                                                                   | `vp run fallow:full`                                                                         | Completed |
| 2026-06-14 | B-007 | Fixed TS2739/TS2740 lint error in `getPinningActionContext.util.test.ts`; removed 4 dead barrel re-exports (`getIsContiguousPin`, `pinAllBetween`, `resolveClosestEdgeSide`, `getChangedPropKeys`)      | `vp check` + `fallow dead-code` → 0 issues                                                   | Completed |
| 2026-06-14 | B-008 | WS-006+WS-007: Removed `commitPinningAndOrderUpdate` dead barrel export; created `createColumnOrderSectionActionMocks` shared factory; wrote 17 dispatch tests across 5 ColumnOrderSection action hooks | `vp check` + `vp run test` 876/876 passed                                                    | Completed |
| 2026-06-14 | B-009 | WS-008: Refactored `serializeFiltersToURL`, `useFetchFilterData`, and `useFetchMoreData` into smaller helper-driven paths; added URL serialization edge-case tests                                      | Focused tests + `vp fmt .` + `vp lint .` + `vp check` + `vp run test` + `vp run fallow:full` | Completed |
| 2026-06-14 | B-010 | WS-009: Simplified enterprise and wide route loaders by delegating shared state bootstrapping to `readTableLoaderStateFromRequest`                                                                      | `vp fmt .` + `vp lint .` + `vp check` + `vp run test` + `vp run fallow:full`                 | Completed |
| 2026-06-14 | B-011 | WS-010: Reduced branch complexity in `OrderDetail.component.tsx` status badge and value formatting logic via lookup maps and focused format helpers                                                     | `vp fmt .` + `vp lint .` + `vp check` + `vp run test` + `vp run fallow:full`                 | Completed |

## Next Execution Plan

| Order | Batch | Scope                                                                               | Success Criteria                                                                                | Validation                                        |
| ----- | ----- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 1     | B-012 | Remaining high-risk table-fetch hotspots (`useFetchMoreData`, `useFetchFilterData`) | Move both files below threshold while preserving pagination/prefetch semantics                  | Targeted tests + full gate + `vp run fallow:full` |
| 2     | B-013 | Remaining threshold functions in `OrderDetail.component.tsx` and `entry.server.tsx` | Bring remaining CRAP-threshold functions to acceptable range with no UX/SSR behavior regression | Targeted tests + full gate + `vp run fallow:full` |
| 3     | B-014 | Stabilize dead-code findings reported by fallow (2 issues)                          | Resolve reported dead code or document intentional retention with rationale                     | `fallow dead-code` + full gate                    |

## Validation Checklist Per Batch

1. Run targeted tests for touched area.
2. Run `vp check`.
3. Run `vp run fallow:full` and record threshold/dupes/dead-code deltas.
4. Optionally run `npx -y fallow dupes --mode semantic` for duplicate-only tracking.
5. Update this file and `WORKSTREAM_LOCKS.md`.

## Decision Rules

- Prefer test and non-critical UI/constants clusters first.
- One cluster per batch unless both are tiny and same area.
- If behavior risk is unclear, split into smaller steps and validate between steps.
- Not all duplication is actionable: accept inherent patterns (e.g., repeating column types) that resist deduplication without harming code clarity.
