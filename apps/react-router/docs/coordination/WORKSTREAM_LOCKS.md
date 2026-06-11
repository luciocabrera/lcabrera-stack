# Workstream Locks

Use this file to claim and release ownership when multiple agents run in parallel.

## Active Locks

| Workstream | Agent   | Files                                                                                                                                                                                                                                                                                                                                                               | Started At           | Validation Plan                                    | Status      |
| ---------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | -------------------------------------------------- | ----------- |
| WS-001     | Copilot | src/components/Table/contexts/TableConfig/columns/actions/useAcceptHeaderPinConflict.hook.test.ts, src/components/Table/contexts/TableConfig/columns/actions/useAcceptHeaderPinSide.hook.test.ts, src/components/Table/contexts/TableConfig/columns/actions/useSetColumnPinning.hook.test.ts, src/components/test-utils/createTableConfigColumnsActionMocks.util.ts | 2026-06-11T13:30:00Z | focused action-hook tests + `vp check` + dupes run | In Progress |
| WS-004     | Copilot | src/routes/enterprise-orders/EnterpriseOrders.constants.tsx                                                                                                                                                                                                                                                                                                         | 2026-06-11T13:30:00Z | focused route/constants checks + `vp check`        | In Progress |

## Lock Template

Copy this row into Active Locks when claiming:

| WS-XXX | AgentName | path/a.ts, path/b.test.ts | 2026-06-11T00:00:00Z | targeted tests + `vp check` | In Progress |

## Completed Locks

| Workstream | Agent   | Completed At         | Result                          |
| ---------- | ------- | -------------------- | ------------------------------- |
| WS-000     | Copilot | 2026-06-11T00:00:00Z | Coordination system initialized |
