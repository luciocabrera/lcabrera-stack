# Fallow Quality Progress Tracker

Last updated: 2026-06-11
Project: apps/react-router

## Current Baseline

- Fallow semantic duplicates: 418 clone groups
- Quality gate: `vp check` passes (format + lint + type)
- Worktree status: clean (no uncommitted changes)

## Goals

- Continue safe duplicate reduction in small batches
- Keep runtime behavior stable after each batch
- Keep `vp check` green after every merge

## Workstream Board

| ID     | Area                                                                           | Priority | Risk   | Owner      | Status | Notes                                          |
| ------ | ------------------------------------------------------------------------------ | -------- | ------ | ---------- | ------ | ---------------------------------------------- |
| WS-001 | TableConfig action hook tests (`dup:be74d40d`, `dup:41849296`, `dup:02c63426`) | P3       | Low    | Unassigned | Ready  | Biggest low-risk test dedupe cluster           |
| WS-002 | Theme tokens (`dup:a93fd860`)                                                  | P3       | Medium | Unassigned | Ready  | Extract shared base + per-theme overrides      |
| WS-003 | Wide dataset service self-duplication (`dup:fab3a5ee`)                         | P3       | Medium | Unassigned | Ready  | Verify repeated logic before extracting helper |
| WS-004 | Route constants overlap (`dup:98d61efa`)                                       | P3       | Low    | Unassigned | Ready  | Consolidate common column constants carefully  |
| WS-005 | Table drawer/context test scaffolds (`dup:d04c3ee1`)                           | P3       | Low    | Unassigned | Ready  | Similar test harnesses; extract shared util    |

## Batch Log

| Date       | Batch | Changes                                                                                                                 | Validation                                             | Result    |
| ---------- | ----- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | --------- |
| 2026-06-11 | B-001 | Introduced shared test store utility + deduped EnterpriseOrders distinct string columns                                 | Focused tests + `vp check` + fallow dupes              | Completed |
| 2026-06-11 | B-002 | Added coordination docs for parallel agent execution                                                                    | `vp check` baseline captured                           | Completed |
| 2026-06-11 | B-003 | Claimed WS-001/WS-004; extracted TableConfig action test scaffold + expanded EnterpriseOrders basic-column helper usage | Focused action tests + `vp check` + fallow dupes check | Completed |

## Validation Checklist Per Batch

1. Run targeted tests for touched area.
2. Run `vp check`.
3. Run `npx -y fallow dupes --mode semantic` and record delta.
4. Update this file and `WORKSTREAM_LOCKS.md`.

## Decision Rules

- Prefer test and non-critical UI/constants clusters first.
- One cluster per batch unless both are tiny and same area.
- If behavior risk is unclear, split into smaller steps and validate between steps.
