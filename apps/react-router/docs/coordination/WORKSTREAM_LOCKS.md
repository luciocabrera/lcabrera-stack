# Workstream Locks

Use this file to claim and release ownership when multiple agents run in parallel.

## Active Locks

| Workstream | Agent | Files | Started At | Validation Plan | Status |
| ---------- | ----- | ----- | ---------- | --------------- | ------ |
| None       | -     | -     | -          | -               | Open   |

## Lock Template

Copy this row into Active Locks when claiming:

| WS-XXX | AgentName | path/a.ts, path/b.test.ts | 2026-06-11T00:00:00Z | targeted tests + `vp check` | In Progress |

## Completed Locks

| Workstream | Agent   | Completed At         | Result                                                                  |
| ---------- | ------- | -------------------- | ----------------------------------------------------------------------- | --- | ------ | ------- | -------------------- | ------------------------------------------------------------------- |
| WS-000     | Copilot | 2026-06-11T00:00:00Z | Coordination system initialized                                         |
| WS-001     | Copilot | 2026-06-11T13:42:00Z | Shared TableConfig action test scaffold adopted in top duplicate tests  |
| WS-004     | Copilot | 2026-06-11T13:42:00Z | EnterpriseOrders constants normalized with helper-based column builders |
| WS-005     | Copilot | 2026-06-11T13:45:00Z | Drawer/context test scaffold deduped via shared createMockStore         |     | WS-002 | Copilot | 2026-06-11T14:00:00Z | Rejected: StyleX factory approach increased duplication (414 → 416) |
| WS-003     | Copilot | 2026-06-11T14:05:00Z | Deferred: 150-column repeating type pattern is inherent duplication     |

## Planned Next Locks

| Workstream | Planned Scope                                                                                                                                                | Suggested Validation                                         | Priority |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ | -------- |
| WS-006     | TableConfig pinning action cluster (`useAcceptHeaderPinSide`, `useSetColumnPinning`, `useAcceptHeaderPinConflict` + resolvers)                               | focused action tests + `vp check` + `vp run fallow:full`     | P1       |
| WS-007     | ColumnOrderSection conflict action cluster (`useAcceptPinSide`, `useAcceptPinConflict`, `useAcceptUnpinConflict`, `useToggleColumnPin`, `useOrderBySorting`) | focused action tests + `vp check` + `vp run fallow:full`     | P1       |
| WS-008     | URL/filter serialization hotspots (`serializeFiltersToURL` path and related URL state flow)                                                                  | targeted URL state tests + `vp check` + `vp run fallow:full` | P2       |
