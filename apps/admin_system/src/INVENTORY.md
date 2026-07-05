# Artifact Inventory (`apps/admin_system`)

Before creating anything new, check this inventory. If something here does the job — or could do it with a small enhancement to make it more generic — **prefer enhancing the existing artifact** over creating a new one.

Shared components/hooks/utils/design-tokens live in `@repo/ui` — see [`packages/ui/src/INVENTORY.md`](../../../packages/ui/src/INVENTORY.md). Postgres-access utilities live in `@repo/data-access`; CQMS's entire read/write query layer lives in `@repo/scan-ingestion/src/queries/`. This file tracks only artifacts genuinely local to this app.

---

## Routes

| Route                                                      | Location                        | Description                                                                                                                                            |
| ---------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/settings`                                                | `routes/settings/`              | Re-export of the shared `@repo/ui/components/Settings` page, mirroring `apps/react-router`'s own route                                                 |
| `/_action/browse-directory`                                | `routes/api/browse-directory/`  | Resource route — thin re-export of `@repo/ui/routing/browseDirectory.loader`; lists a directory's real subdirectories for `Form`'s `path`-type fields  |
| `/cqms`                                                    | `routes/cqms/cqmsIndex.root.ts` | Redirects to `/cqms/projects`                                                                                                                          |
| `/cqms/projects`                                           | `routes/cqms/root.ts`           | Project list — `TableLayout` fed `project_run_summary` rows (streamed via `projectsPromise`); "New Project" renders via `Table`'s own `actions` slot   |
| `/cqms/projects/new`                                       | `routes/cqms/new-project/`      | Register a project (`Form` in a `SectionCard`, action-only) — calls `registerProject`                                                                  |
| `/cqms/projects/edit/:projectId`                           | `routes/cqms/edit-project/`     | Rename/re-path a project (`Form` mode='edit' in a `SectionCard`, loader+action) — calls `updateProject`                                                |
| `/cqms/projects/view/:projectId`                           | `routes/cqms/project-detail/`   | Project header + trend sparklines (`use()`+Suspense) + runs `TableLayout`; links to edit + trigger-scan                                                |
| `/cqms/projects/view/:projectId/trigger-scan`              | `routes/cqms/trigger-scan/`     | Trigger a scan (`Form` in a `SectionCard`, multi-select scanners, streamed via `scannersPromise`) — calls `triggerScan`; does not spawn a job (step 9) |
| `/cqms/projects/view/:projectId/runs/:runId`               | `routes/cqms/run-detail/`       | One run's scans `TableLayout`                                                                                                                          |
| `/cqms/projects/view/:projectId/runs/:runId/scans/:scanId` | `routes/cqms/scan-detail/`      | Tabs: `MarkdownRenderer` report (streamed via `reportPromise`), findings `TableLayout`, `JsonExplorer` for raw JSON                                    |

## CQMS-local Utils

| Util                        | Location                                              | Description                                                                                                       |
| --------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `resolveRunStatusTone`      | `routes/cqms/utils/resolveRunStatusTone.util.ts`      | Maps a `cqms.runs`/`cqms.scans` status string to a `StatusBadgeTone` — `StatusBadge` itself has no domain opinion |
| `groupTrendByScanner`       | `routes/cqms/utils/groupTrendByScanner.util.ts`       | Groups `project_scanner_trend` rows by scanner into `TrendSparkline`'s `values` arrays                            |
| `buildJsonExplorerSections` | `routes/cqms/utils/buildJsonExplorerSections.util.ts` | Walks a scan's `raw_json` into `JsonExplorer` sections; calls `inferTableColumnsFromJson` server-side             |
| `RunLink`                   | `routes/cqms/project-detail/RunLink/`                 | Private delegate — links a run row to its detail page (`/cqms/projects/view/:projectId/runs/:runId`)              |
| `ScanLink`                  | `routes/cqms/run-detail/ScanLink/`                    | Private delegate — links a scan row to its detail page                                                            |
| `ProjectTrendPanel`         | `routes/cqms/project-detail/ProjectTrendPanel/`       | Reads `trendPromise` via `use()` inside a `<Suspense>` boundary, renders one `TrendSparkline` per scanner         |
| `TriggerScanForm`           | `routes/cqms/trigger-scan/TriggerScanForm/`           | Reads `scannersPromise` via `use()` inside a `<Suspense>` boundary, renders the scanner-select `Form`             |
| `ScanReportPanel`           | `routes/cqms/scan-detail/ScanReportPanel/`            | Reads `reportPromise` via `use()` inside a `<Suspense>` boundary, renders the `MarkdownRenderer` report           |

---

## Keeping This Inventory Current

When you add, rename, or remove an artifact:

- Add / update the row in the relevant table above
- If enhancing an existing artifact (making it more generic), update its description row — do **not** add a new row
- If an artifact becomes generic enough to be useful beyond this app, move it to `@repo/ui` (or `@repo/scan-ingestion` for query logic) and remove it from here
