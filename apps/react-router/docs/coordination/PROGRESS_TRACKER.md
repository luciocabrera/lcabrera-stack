# Fallow Quality Progress Tracker

Last updated: 2026-06-11
Project: apps/react-router

## Current Baseline

- Fallow semantic duplicates: 414 clone groups (was 418 at start)
- Quality gate: `vp check` passes (format + lint + type)
- Worktree status: clean (no uncommitted changes)

## Goals

- Continue safe duplicate reduction in small batches
- Keep runtime behavior stable after each batch
- Keep `vp check` green after every merge

## Workstream Board

| ID     | Area                                                                           | Priority | Risk   | Owner   | Status    | Notes                                                            |
| ------ | ------------------------------------------------------------------------------ | -------- | ------ | ------- | --------- | ---------------------------------------------------------------- |
| WS-001 | TableConfig action hook tests (`dup:be74d40d`, `dup:41849296`, `dup:02c63426`) | P3       | Low    | Copilot | Completed | Shared test scaffold adopted in top duplicate tests              |
| WS-002 | Theme tokens (`dup:a93fd860`)                                                  | P3       | Medium | Copilot | Rejected  | Factory approach created new patterns; inherent to StyleX themes |
| WS-003 | Wide dataset service self-duplication (`dup:fab3a5ee`)                         | P3       | Medium | Copilot | Deferred  | 150-column repeating pattern; inherent structural duplication    |
| WS-004 | Route constants overlap (`dup:98d61efa`)                                       | P3       | Low    | Copilot | Completed | Consolidate common column constants carefully                    |
| WS-005 | Table drawer/context test scaffolds (`dup:d04c3ee1`)                           | P3       | Low    | Copilot | Completed | Similar test harnesses; extract shared util                      |

## Batch Log

| Date       | Batch | Changes                                                                                                                 | Validation                                             | Result    |
| ---------- | ----- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | --------- |
| 2026-06-11 | B-001 | Introduced shared test store utility + deduped EnterpriseOrders distinct string columns                                 | Focused tests + `vp check` + fallow dupes              | Completed |
| 2026-06-11 | B-002 | Added coordination docs for parallel agent execution                                                                    | `vp check` baseline captured                           | Completed |
| 2026-06-11 | B-003 | Claimed WS-001/WS-004; extracted TableConfig action test scaffold + expanded EnterpriseOrders basic-column helper usage | Focused action tests + `vp check` + fallow dupes check | Completed |
| 2026-06-11 | B-004 | Claimed WS-005; migrated drawer/context tests to shared createMockStore utility                                         | Focused drawer/data tests + `vp check` + fallow dupes  | Completed |
| 2026-06-11 | B-005 | Attempted WS-002 theme token extraction; reverted when factory approach increased duplication (414 → 416)               | `vp check` + fallow dupes analysis                     | Rejected  |
| 2026-06-11 | B-004 | Claimed WS-005; migrated drawer/context tests to shared createMockStore utility                                         | Focused drawer/data tests + `vp check` + fallow dupes  | Completed |

## Validation Checklist Per Batch

1. Run targeted tests for touched area.
2. Run `vp check`.
3. Run `npx -y fallow dupes --mode semantic` and record delta.
4. Update this file and `WORKSTREAM_LOCKS.md`.

## Decision Rules

- Prefer test and non-critical UI/constants clusters first.
- One cluster per batch unless both are tiny and same area.
- If behavior risk is unclear, split into smaller steps and validate between steps.
- Not all duplication is actionable: accept inherent patterns (e.g., repeating column types) that resist deduplication without harming code clarity.
