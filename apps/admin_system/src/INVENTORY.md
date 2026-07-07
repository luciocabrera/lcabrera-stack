# Artifact Inventory (`apps/admin_system`)

Before creating anything new, check this inventory. If something here does the job — or could do it with a small enhancement to make it more generic — **prefer enhancing the existing artifact** over creating a new one.

Shared components/hooks/utils/design-tokens live in `@repo/ui` — see [`packages/ui/src/INVENTORY.md`](../../../packages/ui/src/INVENTORY.md). Postgres-access utilities live in `@repo/data-access`; CQMS's entire read/write query layer lives in `@repo/scan-ingestion/src/queries/`. This file tracks only artifacts genuinely local to this app.

---

## Routes

| Route                                                      | Location                        | Description                                                                                                                                                                                  |
| ---------------------------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/login`                                                   | `routes/login/`                 | Username/password sign-in (`Form` in a `SectionCard`, loader+action) — `authenticateUser` + cookie session; bounces already-authenticated visitors to the app (ADR-017)                      |
| `/logout`                                                  | `routes/logout/`                | Action-only (POST) — destroys the auth session and redirects to `/login` (ADR-017)                                                                                                           |
| `/settings`                                                | `routes/settings/`              | Re-export of the shared `@repo/ui/components/Settings` page, mirroring `apps/react-router`'s own route                                                                                       |
| `/_action/browse-directory`                                | `routes/api/browse-directory/`  | Resource route — `requireUser`-gated wrapper (ADR-017) around `@repo/ui/routing/browseDirectory.loader`; lists a directory's real subdirectories for `Form`'s `path`-type fields             |
| `/cqms`                                                    | `routes/cqms/cqmsIndex.root.ts` | Redirects to `/cqms/projects`                                                                                                                                                                |
| `/cqms/projects`                                           | `routes/cqms/root.ts`           | Project list — `TableLayout` fed `project_run_summary` rows (streamed via `projectsPromise`); "New Project" renders via `Table`'s own `actions` slot                                         |
| `/cqms/projects/new`                                       | `routes/cqms/new-project/`      | Register a project (`Form` in a `SectionCard`, action-only) — calls `registerProject`                                                                                                        |
| `/cqms/projects/edit/:projectId`                           | `routes/cqms/edit-project/`     | Rename/re-path a project (`Form` mode='edit' in a `SectionCard`, loader+action) — calls `updateProject`                                                                                      |
| `/cqms/projects/view/:projectId`                           | `routes/cqms/project-detail/`   | Project header + trend sparklines (`use()`+Suspense) + runs `TableLayout`; links to edit + trigger-scan; hosts the per-instance grants editor (`ProjectGrantsPanel`, admin-only — ADR-024)   |
| `/cqms/projects/view/:projectId/trigger-scan`              | `routes/cqms/trigger-scan/`     | Trigger a scan (`Form`, multi-select scanners + workspace scopes (ADR-021), streamed via `scannersPromise`) — calls `triggerScan`; permission denials render as typed field errors (ADR-024) |
| `/cqms/projects/view/:projectId/runs/:runId`               | `routes/cqms/run-detail/`       | One run's scans `TableLayout`; subscribes to live status via `useRunStatusSocket`                                                                                                            |
| `/cqms/projects/view/:projectId/runs/:runId/scans/:scanId` | `routes/cqms/scan-detail/`      | Tabs: `MarkdownRenderer` report (streamed via `reportPromise`), findings `TableLayout`, `JsonExplorer` for raw JSON                                                                          |
| `/cqms/scanners` (+ `new`, `edit/:id`, `view/:id`)         | `routes/cqms/scanners/` etc.    | Scanner registry CRUD (ADR-023) — first consumer of `Table`'s crud metadata; register/update bump `scanner_versions` snapshots and generate missing skill artifacts on disk                  |
| `/cqms/admin/users` (+ `new`, `edit/:username`, `view/…`)  | `routes/cqms/users/` etc.       | User management (ADR-024, `requirePermission`-gated) — create/edit users, role assignment, password rotation; keyed by immutable `username`                                                  |
| `/cqms/admin/roles` (+ `new`, `edit/:roleName`, `view/…`)  | `routes/cqms/roles/` etc.       | Role management (ADR-024, `requirePermission`-gated) — create/edit roles + permission matrix multi-select; keyed by immutable `role_name`                                                    |

## Hooks

| Hook                 | Location                           | Description                                                                                                                                                                                                                                                                 |
| -------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useRunStatusSocket` | `hooks/useRunStatusSocket.hook.ts` | Subscribes to `apps/scan-orchestrator`'s `/ws/runs` WebSocket for one `runId`; calls `revalidate()` on any message (cache-invalidation signal only, ADR-015) and surfaces a `useNotifyAction` toast on a terminal `scan-status` (`failed`/`succeeded`) transition (ADR-016) |

## Auth (ADR-017)

| Artifact            | Location                         | Description                                                                                                                                                                      |
| ------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requireUser`       | `auth/requireUser.util.ts`       | The gate every cqms loader/action calls first — validates the session's userId against `cqms.v_users` per request, else throws a redirect to `/login?redirectTo=<destination>`   |
| `requirePermission` | `auth/requirePermission.util.ts` | `requireUser` → `checkUserPermission` → throws a 403 carrying the DB's own denial reason; gates the admin routes at route level (Postgres still asserts in every write, ADR-024) |
| `getSessionStorage` | `auth/getSessionStorage.util.ts` | Cookie session storage (`__cqms_session`, httpOnly, sameSite=lax) signed with the Zod-validated `SESSION_SECRET` (`auth/env.schema.ts`)                                          |

## CQMS-local Utils

| Util                           | Location                                              | Description                                                                                                                 |
| ------------------------------ | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `resolveRunStatusTone`         | `routes/cqms/utils/resolveRunStatusTone.util.ts`      | Maps a `cqms.runs`/`cqms.scans` status string to a `StatusBadgeTone` — `StatusBadge` itself has no domain opinion           |
| `groupTrendByScanner`          | `routes/cqms/utils/groupTrendByScanner.util.ts`       | Groups `project_scanner_trend` rows by scanner into `TrendSparkline`'s `values` arrays                                      |
| `buildJsonExplorerSections`    | `routes/cqms/utils/buildJsonExplorerSections.util.ts` | Walks a scan's `raw_json` into `JsonExplorer` sections; calls `inferTableColumnsFromJson` server-side                       |
| `RunLink`                      | `routes/cqms/project-detail/RunLink/`                 | Private delegate — links a run row to its detail page (`/cqms/projects/view/:projectId/runs/:runId`)                        |
| `ScanLink`                     | `routes/cqms/run-detail/ScanLink/`                    | Private delegate — links a scan row to its detail page                                                                      |
| `ProjectTrendPanel`            | `routes/cqms/project-detail/ProjectTrendPanel/`       | Reads `trendPromise` via `use()` inside a `<Suspense>` boundary, renders one `TrendSparkline` per scanner                   |
| `TriggerScanForm`              | `routes/cqms/trigger-scan/TriggerScanForm/`           | Reads `scannersPromise` via `use()` inside a `<Suspense>` boundary, renders the scanner-select `Form`                       |
| `ScanReportPanel`              | `routes/cqms/scan-detail/ScanReportPanel/`            | Reads `reportPromise` via `use()` inside a `<Suspense>` boundary, renders the `MarkdownRenderer` report                     |
| `ProjectGrantsPanel`           | `routes/cqms/project-detail/ProjectGrantsPanel/`      | Per-instance grants editor (ADR-024) — fetcher forms posting `grant-add`/`grant-delete` intents, curated grant options      |
| `NewUserForm` / `EditUserForm` | `routes/cqms/new-user/` · `routes/cqms/edit-user/`    | User forms reading the streamed role list via `use()` (TriggerScanForm contract); edit adds enabled + optional new password |
| `NewRoleForm` / `EditRoleForm` | `routes/cqms/new-role/` · `routes/cqms/edit-role/`    | Role forms reading the streamed permission list via `use()`; permission matrix as a labeled multi-select                    |
| `isCheckboxChecked`            | `routes/cqms/utils/isCheckboxChecked.util.ts`         | Strict `=== 'on'` coercion for the shared `Form`'s native checkboxes — a crafted empty-string value must not read true      |

---

## Keeping This Inventory Current

When you add, rename, or remove an artifact:

- Add / update the row in the relevant table above
- If enhancing an existing artifact (making it more generic), update its description row — do **not** add a new row
- If an artifact becomes generic enough to be useful beyond this app, move it to `@repo/ui` (or `@repo/scan-ingestion` for query logic) and remove it from here
