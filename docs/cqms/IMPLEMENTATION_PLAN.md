# Code Quality Management System (CQMS) — Implementation Plan

> **⚠️ Historical (superseded 2026-07-11).** This is the plan for the
> **pre-pivot, local-path build**. It is kept because its Phase 1/Phase 3 steps
> describe what was actually built and still runs. The canonical product
> definition is now [PRD_V2.md](./PRD_V2.md) (CodePulse), and the forward plan
> is the [alignment review](./reviews/2026-07-11-codepulse-alignment-review.md)
> §6. For what is built today versus what PRD_V2 requires, read
> **[STATUS.md](./STATUS.md)** — not this file.
>
> **⚠️ Two unrelated phase numberings are live in this folder.** The Phase
> 1/2/3 on this page is **not** the Phase 1–4 in the alignment review and
> STATUS.md:
>
> | Here (pre-pivot)                                                   | Alignment review §6 / STATUS.md                             |
> | ------------------------------------------------------------------ | ----------------------------------------------------------- |
> | Phase 1 = the original 9 steps (done)                              | Phase 1 = Ingestion foundation (done)                       |
> | Phase 2 = per-symbol dependency graph (not started)                | Phase 2 = Containerized, queue-free execution (not started) |
> | Phase 3 = per-scanner extraction, RBAC, registry, app graph (done) | Phase 3 = Scanner platform (not started)                    |
> |                                                                    | Phase 4 = Progress & polish (not started)                   |
>
> Always say which namespace you mean.

See also: [STATUS.md](./STATUS.md), [PRD_V2.md](./PRD_V2.md), [PRD.md](./PRD.md), [TECH_SPEC.md](./TECH_SPEC.md), ADRs in [decisions/](./decisions/).

Phase 1 (the original 9 steps) and Phase 3 (per-scanner extraction + RBAC + registry, § below) are both complete; Phase 2 = the dependency graph (§ below), still explicitly out of scope. **Both "complete" claims refer to this page's own namespace** (see the table above) and remain accurate for what shipped — but the ingestion model they were built on has since been replaced by the snapshot model (ADR-028), so parts of the verification plan below no longer describe the system.

## Execution model

The 9 steps below are executed **one at a time, gated** — before starting each step's code, the approach for that step gets presented and confirmed, rather than running through all 9 autonomously. Each step's ADR (`docs/cqms/decisions/ADR-NNN-*.md`) lands in the same commit as that step's code.

## Steps

**All 9 steps are complete.** Step 9's build produced two real, previously-hidden bugs
(the `linter-checker` skill only ever worked against this repo; `packages/scan-ingestion`'s new `exports` map briefly broke every other subpath) — see ADR-015 for both.

1. **Extract `packages/ui`** — Table (including the runtime-inferred-columns extension, TECH*SPEC §2.9 — budget real design time here, it's new capability, not a lift-and-shift), `useStore.hook.ts`, loader-state utils, Card, SidePanel, Icons, RouteErrorBoundary, Tabs, Modal, Toolbar/AppNavigation/NavLink, design tokens; update `apps/react-router`'s imports; write the ADR. \_Blocks every later step that needs shared components.*
2. **Build the generic `Form` component** (TECH*SPEC §2.10) — can run in parallel with step 1's Table work (same package), since it depends only on the migrated `useStore.hook.ts`, not on Table itself. \_No CQMS route needs this until step 8, but building it here keeps all `packages/ui` foundational work together.*
3. **Provision the CQMS schema** — `packages/scan-ingestion` migration 0001 (uuid PKs) + 0002 (functions) + 0003 (views) from TECH*SPEC §2.3/§2.3a, minimal migration runner, seed the 4 `scanners` rows, run against the already-running `docker/local` Postgres instance (new database name, same container — no new infra). \_Everything else reads/writes these tables.*
4. **Build `packages/scan-ingestion` core** — DB layer, thin Zod pre-check (TECH*SPEC §2.3a), `ingestReport()`, file-classification util, project matching, CLI wrapper. This package is CQMS's entire persistence/API backend — no `apps/api-server` involvement anywhere. \_One shared contract both consumers depend on.*
5. **Add `report.json` emission to all three existing skills** (`fallow-code-checker`, `code-smell-checker`, `code-smell-zen`), validated against step 4's schema. _Proves the contract against real output before the linter skill is built against it or anything ingests it._
6. **Build the new `linter-checker` skill** (TECH*SPEC §2.5: deterministic mapping script + templated report.md, mirrors `fallow-code-checker`'s directory shape), wire the ingestion CLI into all 4 skills' final steps, update `.claude/settings.json` allowlists, run `scripts/validate-skills.cjs`. \_Validates ingestion with a human-in-the-loop run before anything unattended depends on it.*
7. **Build `packages/agent-runner`** — SKILL.md loader/parser, tool/cwd scoping, child-process sandboxing, the `OUTPUT_DIR` convention change to the 3 Agent-SDK-driven skills (not linter). _Depends on skills already being ingestion-aware and JSON-emitting._
8. **Build `admin_system`'s CQMS routes/UI** against real rows produced manually via steps 3–6's CLI, including the `Form`-based `new-project`/`trigger-scan` forms and the `JsonExplorer`/`inferTableColumnsFromJson` work against real `raw_json` samples from all 4 scanners. _Isolates UI bugs from job-orchestration bugs; needs `packages/ui` from steps 1–2._
9. **Build a standalone `apps/scan-orchestrator` process** (TECH_SPEC §2.7, revised: two processes, not one custom `admin_system/server.ts`). `apps/admin_system` stays on stock `react-router dev`/`@react-router/serve`, completely untouched — no custom server entry, no Express, no Vite plugin. The new process:
   - a one-line `pg_notify('cqms_scan_queued', run_id::text)` addition to `fn_create_run_with_scans`, plus a dedicated `LISTEN` connection in the orchestrator reacting to it;
   - a reconciliation poll (`SELECT * FROM scans WHERE status = 'queued'`, on startup and on a slow interval) as the durability backstop, since `NOTIFY` itself isn't persisted;
   - the actual job execution, branching per §2.5 on `scanners.deterministic` (linter → plain child process; the other 3 → `@repo/agent-runner`'s `runSkillAgent`), calling `ingestReport()` / writing status transitions;
   - a plain `node:http` + `ws` `WebSocketServer` and `runStatusHub.util.ts` (in-memory `Map<runId, Set<WebSocket>>`), published to immediately after each transition since execution and the hub now share one process.

   Client-side: point `useRunStatusSocket.hook.ts` at the orchestrator's own WS origin instead of same-origin. _Last — the integration of every prior piece, and still the highest-risk (security-sensitive, async, unattended, new process) item, but no longer entangled with `admin_system`'s own dev/prod server lifecycle._

## Phase 2 (explicitly out of scope now)

Per-symbol dependency graph (`symbols`/`symbol_references` tables, TECH_SPEC §2.3), tooling recommendation `ts-morph`, to feed an LLM reasoning pass over duplication/misplaced-exports once Phase 1's data model is proven in production. Phase 3's `app_graph_nodes` + the ts-morph catalog dependency (ADR-022) lay its groundwork without building it.

## Phase 3 — per-scanner extraction, RBAC, scanner registry, app graph (complete, 2026-07)

Same gated execution model as Phase 1 (one step at a time, ADR lands with its step). Everything tool-specific was trapped in opaque jsonb (`scans.raw_json`/`scans.health_metrics`); Phase 3 added per-scanner **master/detail tables** (1:1 master row per scan), Postgres-enforced **RBAC**, a **scanner registry** with UI registration + artifact generation, and made **every DB operation go through functions/procedures/views** — tables are never touched directly. Interview decisions (2026-07-06) are recorded at the top of each ADR.

1. **RBAC schema + auth core** (migration 0008; [ADR-017](./decisions/ADR-017-rbac-schema-and-auth-core.md)) — users/roles/permissions/role_permissions/user_roles/resource_grants, `fn_assert_permission` (deny-by-default, typed exceptions), scrypt password hashing, `/login` + cookie session + `requireUser`.
2. **Audit fields + functions-only retrofit** (migration 0009; [ADR-018](./decisions/ADR-018-audit-fields-and-functions-only-access.md)) — audit columns on all entities, every query util moved to views/`p_user_id`-first functions; orchestrator writes as the seeded `system` user.
3. **Lint split + master/detail** (migration 0010; [ADR-019](./decisions/ADR-019-lint-split-and-master-detail-extraction.md)) — `eslint`/`oxlint` as independent scanners (`linter` soft-retired), shared `lint_violations` detail + per-tool masters, `DETERMINISTIC_SCANNER_CONFIGS` map in the orchestrator.
4. **Deterministic fallow** (migration 0011; ADR-019) — `fallow --format json` run directly like the linter; `fallow_runs` master + the full detail family (file scores, hotspots, clones, dead code, circular deps, large functions, targets, function findings).
5. **Code-smell masters** (migration 0012; ADR-019) — `code_smell_checker_runs`/`code_smell_zen_runs` masters; details stay views over `scan_findings`.
6. **Self-scan + secret guard** ([ADR-020](./decisions/ADR-020-self-scan-and-secret-file-guard.md)) — repo-root targets allowed (ancestor block kept); Agent-SDK PreToolUse hook denies secret-file reads in scanner sessions.
7. **Workspace discovery + scoped scans** (migration 0013; [ADR-021](./decisions/ADR-021-workspace-discovery-and-scoped-scans.md)) — `project_workspaces` + discovery from pnpm-workspace.yaml/package.json, trigger-scan workspace multi-select, longest-prefix attribution views.
8. **App-graph scanner** (migration 0014; [ADR-022](./decisions/ADR-022-app-graph-scanner.md)) — deterministic tree inventory (`app_graph_runs` + `app_graph_nodes`), per-file export/function/type counts via ts-morph.
9. **Scanner registry + artifact generation** (migration 0015; [ADR-023](./decisions/ADR-023-scanner-registry-and-artifact-generation.md)) — extended `scanners` columns + `scanner_versions` snapshots, `/cqms/scanners` CRUD UI, template-generated SKILL.md/runner scaffolds (code on disk stays authoritative), auto-created generic detail tables.
10. **User/role management UI** (migration 0016; [ADR-024](./decisions/ADR-024-user-role-management.md)) — `/cqms/admin/users` + `/cqms/admin/roles`, per-instance grants editor on project detail, lockout guards, password rotation.
11. **Docs sync + final E2E** — this document, INVENTORY.md, ARCHITECTURE.md sweeps; full self-scan of the CQMS repo with all scanners, workspace-scoped run, external-repo degradation, permission negative test, dummy-scanner registration round-trip.

## Verification plan

> **⚠️ Steps 2, 3, 6 and 7 below describe the retired local-path model and will
> not reproduce today.** `projects.local_path` was **dropped by migration
> `0027_project_snapshots.sql`** (ADR-028): a project's code location is now
> whatever its latest synced snapshot is, so there is no path to register, no
> path to reject, and no `PathField` to submit. Each affected step is annotated
> inline. The steps are kept as the historical record of how the pre-pivot build
> was verified; the equivalent checks for the current model belong with Phase 1
> of the [alignment review](./reviews/2026-07-11-codepulse-alignment-review.md)
> §6, and current state is tracked in [STATUS.md](./STATUS.md).

1. `vp fmt . && vp lint . && vp check && vp run test` from `apps/react-router` and `apps/admin_system` — must pass clean.
2. Manually run `/fallow-code-checker` and the new `/linter-checker` in an interactive session against this repo → confirm a `projects`/`runs`/`scans`/`reports`/`scan_findings` row set appears correctly for each (~~no `run_id` given — tests the auto-create path~~ — **RETIRED (ADR-028)**: path-based match-or-create is gone; ad hoc ingestion now _requires_ `--project-id` and throws without it, see `resolveScan.util.ts`), with proper uuid PKs.
3. Start `apps/admin_system` in both dev and a production build, ~~register a project pointing at a real local repo~~ (**RETIRED (ADR-028)**: register a project, then **sync a snapshot** to it — CLI push, zip upload, or the browser folder-picker per ADR-031), trigger a scan from the UI (both a deterministic linter-only run and a code-smell run), confirm the WebSocket delivers live status transitions in the run-detail `Table` in both dev and prod modes, confirm the finished run's report renders, the `JsonExplorer` correctly derives table columns from at least two structurally different scanners' raw JSON (e.g. fallow vs. linter), and the findings table filters by severity.
4. Kill and reconnect the WebSocket mid-run (e.g. restart the dev server) and confirm the client's reconnect-with-backoff recovers and status catches up via revalidation.
5. Run a second scan on the same project a day later (or manually insert a second `runs` row) and confirm the trend view shows a correct up/down delta.
6. ~~Attempt to trigger a scan against a path not in `projects.local_path` and confirm it's rejected server-side.~~ **RETIRED (ADR-028)** — `local_path` no longer exists; the caller supplies no path at all. The current equivalent is the "trigger with no snapshot = error" precondition, enforced by `0027`'s trigger (`ERRCODE 55000`) and pre-checked in `triggerScan.action.ts`.
7. Submit the `new-project` and `trigger-scan` `Form`-based forms with both valid and invalid input (~~e.g. a non-existent local path~~ — **RETIRED (ADR-028)**: `PathField` is deleted and `new-project` takes no path; use "no scanners selected") and confirm client-side field errors show instantly, the server-side Zod validation is what actually gates the action, and successful submission produces the expected `projects`/`runs`/`scans` rows.
