# Fallow Quality Progress Tracker

Last updated: 2026-06-14
Project: apps/react-router

## Current Baseline

- Fallow full (`vp run fallow:full`): 28 above threshold · maintainability 93 (good) · 3078 analyzed
- Fallow full failures: dead-code (6 issues), dupes (67 clone groups), health (28 above threshold)
- Canonical machine-readable source: `reports/fallow/fallow-full-latest.json`
- Analysis source doc: `reports/fallow-complexity-threshold-analysis.md`
- Quality gate: `vp check` passes (format + lint + type)
- Worktree status: active (see current `git status --short`)

## Goals

- Continue safe duplicate reduction in small batches
- Reduce health threshold count from 28 by targeting highest-impact complexity hotspots first
- Keep runtime behavior stable after each batch
- Keep `vp check` green after every merge

## Workstream Board

| ID     | Area                                                                           | Priority | Risk   | Owner   | Status    | Notes                                                                  |
| ------ | ------------------------------------------------------------------------------ | -------- | ------ | ------- | --------- | ---------------------------------------------------------------------- |
| WS-001 | TableConfig action hook tests (`dup:be74d40d`, `dup:41849296`, `dup:02c63426`) | P3       | Low    | Copilot | Completed | Shared test scaffold adopted in top duplicate tests                    |
| WS-002 | Theme tokens (`dup:a93fd860`)                                                  | P3       | Medium | Copilot | Rejected  | Factory approach created new patterns; inherent to StyleX themes       |
| WS-003 | Wide dataset service self-duplication (`dup:fab3a5ee`)                         | P3       | Medium | Copilot | Deferred  | 150-column repeating pattern; inherent structural duplication          |
| WS-004 | Route constants overlap (`dup:98d61efa`)                                       | P3       | Low    | Copilot | Completed | Consolidate common column constants carefully                          |
| WS-005 | Table drawer/context test scaffolds (`dup:d04c3ee1`)                           | P3       | Low    | Copilot | Completed | Similar test harnesses; extract shared util                            |
| WS-006 | TableConfig pinning action cluster complexity                                  | P1       | Medium | Copilot | Planned   | Target: accept-header pin side/conflict + set pinning hooks/resolvers  |
| WS-007 | ColumnOrderSection conflict action cluster complexity                          | P1       | Medium | Copilot | Planned   | Target: accept pin side/conflict/unpin + toggle pin + order by sorting |
| WS-008 | URL/filter serialization complexity hotspots                                   | P2       | Medium | Copilot | Planned   | Target: serialize filters and related URL state flow hotspots          |

## Batch Log

| Date       | Batch | Changes                                                                                                                 | Validation                                             | Result    |
| ---------- | ----- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | --------- |
| 2026-06-11 | B-001 | Introduced shared test store utility + deduped EnterpriseOrders distinct string columns                                 | Focused tests + `vp check` + fallow dupes              | Completed |
| 2026-06-11 | B-002 | Added coordination docs for parallel agent execution                                                                    | `vp check` baseline captured                           | Completed |
| 2026-06-11 | B-003 | Claimed WS-001/WS-004; extracted TableConfig action test scaffold + expanded EnterpriseOrders basic-column helper usage | Focused action tests + `vp check` + fallow dupes check | Completed |
| 2026-06-11 | B-004 | Claimed WS-005; migrated drawer/context tests to shared createMockStore utility                                         | Focused drawer/data tests + `vp check` + fallow dupes  | Completed |
| 2026-06-11 | B-005 | Attempted WS-002 theme token extraction; reverted when factory approach increased duplication (414 → 416)               | `vp check` + fallow dupes analysis                     | Rejected  |
| 2026-06-11 | B-004 | Claimed WS-005; migrated drawer/context tests to shared createMockStore utility                                         | Focused drawer/data tests + `vp check` + fallow dupes  | Completed |
| 2026-06-14 | B-006 | Revalidated complexity baseline with project command and reconciled reported mismatch                                   | `vp run fallow:full`                                   | Completed |

## Next Execution Plan

| Order | Batch | Scope                                              | Success Criteria                                                                                                                   | Validation                                                                                                     |
| ----- | ----- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 1     | B-007 | WS-006: TableConfig pinning action cluster         | Reduce complexity in the three pinning hooks by extracting decision branches into focused colocated utils without behavior changes | Focused tests for touched hooks + `vp fmt .` + `vp lint .` + `vp check` + `vp run test` + `vp run fallow:full` |
| 2     | B-008 | WS-007: ColumnOrderSection conflict action cluster | Further lower threshold count by splitting modal/acceptance decision trees into pure resolvers                                     | Focused tests for touched actions + full gate + `vp run fallow:full`                                           |
| 3     | B-009 | WS-008: URL/filter serialization hotspots          | Reduce high cognitive/cyclomatic pressure in URL serialization path while preserving route behavior                                | Targeted URL state tests + full gate + `vp run fallow:full`                                                    |

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
