# Code Quality Management System (CQMS) — Implementation Plan

See also: [PRD.md](./PRD.md), [TECH_SPEC.md](./TECH_SPEC.md), ADRs in [decisions/](./decisions/).

Phase 1 only; Phase 2 = the dependency graph (§ below), explicitly out of scope for this build.

## Execution model

The 9 steps below are executed **one at a time, gated** — before starting each step's code, the approach for that step gets presented and confirmed, rather than running through all 9 autonomously. Each step's ADR (`docs/cqms/decisions/ADR-NNN-*.md`) lands in the same commit as that step's code.

## Steps

1. **Extract `packages/ui`** — Table (including the runtime-inferred-columns extension, TECH*SPEC §2.9 — budget real design time here, it's new capability, not a lift-and-shift), `useStore.hook.ts`, loader-state utils, Card, SidePanel, Icons, RouteErrorBoundary, Tabs, Modal, Toolbar/AppNavigation/NavLink, design tokens; update `apps/react-router`'s imports; write the ADR. \_Blocks every later step that needs shared components.*
2. **Build the generic `Form` component** (TECH*SPEC §2.10) — can run in parallel with step 1's Table work (same package), since it depends only on the migrated `useStore.hook.ts`, not on Table itself. \_No CQMS route needs this until step 8, but building it here keeps all `packages/ui` foundational work together.*
3. **Provision the CQMS schema** — `packages/scan-ingestion` migration 0001 (uuid PKs) + 0002 (functions) + 0003 (views) from TECH*SPEC §2.3/§2.3a, minimal migration runner, seed the 4 `scanners` rows, run against the already-running `docker/local` Postgres instance (new database name, same container — no new infra). \_Everything else reads/writes these tables.*
4. **Build `packages/scan-ingestion` core** — DB layer, thin Zod pre-check (TECH*SPEC §2.3a), `ingestReport()`, file-classification util, project matching, CLI wrapper. This package is CQMS's entire persistence/API backend — no `apps/api-server` involvement anywhere. \_One shared contract both consumers depend on.*
5. **Add `report.json` emission to all three existing skills** (`fallow-code-checker`, `code-smell-checker`, `code-smell-zen`), validated against step 4's schema. _Proves the contract against real output before the linter skill is built against it or anything ingests it._
6. **Build the new `linter-checker` skill** (TECH*SPEC §2.5: deterministic mapping script + templated report.md, mirrors `fallow-code-checker`'s directory shape), wire the ingestion CLI into all 4 skills' final steps, update `.claude/settings.json` allowlists, run `scripts/validate-skills.cjs`. \_Validates ingestion with a human-in-the-loop run before anything unattended depends on it.*
7. **Build `packages/agent-runner`** — SKILL.md loader/parser, tool/cwd scoping, child-process sandboxing, the `OUTPUT_DIR` convention change to the 3 Agent-SDK-driven skills (not linter). _Depends on skills already being ingestion-aware and JSON-emitting._
8. **Build `admin_system`'s CQMS routes/UI** against real rows produced manually via steps 3–6's CLI, including the `Form`-based `new-project`/`trigger-scan` forms and the `JsonExplorer`/`inferTableColumnsFromJson` work against real `raw_json` samples from all 4 scanners. _Isolates UI bugs from job-orchestration bugs; needs `packages/ui` from steps 1–2._
9. **Replace `admin_system`'s server with the custom Express + WebSocket entry** (TECH*SPEC §2.7: `server.ts`, `runStatusHub.util.ts`, the dev-mode Vite plugin), then **wire `trigger-scan` + background job + WebSocket status push**, branching per §2.5 (deterministic linter → plain child process; other 3 → `agent-runner`). \_Last — the integration of every prior piece, and the highest-risk (security-sensitive, async, unattended, new server infra) item.*

## Phase 2 (explicitly out of scope now)

Per-symbol dependency graph (`symbols`/`symbol_references` tables, TECH_SPEC §2.3), tooling recommendation `ts-morph`, to feed an LLM reasoning pass over duplication/misplaced-exports once Phase 1's data model is proven in production.

## Verification plan

1. `vp fmt . && vp lint . && vp check && vp run test` from `apps/react-router` and `apps/admin_system` — must pass clean.
2. Manually run `/fallow-code-checker` and the new `/linter-checker` in an interactive session against this repo → confirm a `projects`/`runs`/`scans`/`reports`/`scan_findings` row set appears correctly for each (no `run_id` given — tests the auto-create path), with proper uuid PKs.
3. Start `apps/admin_system` in both dev and a production build, register a project pointing at a real local repo, trigger a scan from the UI (both a deterministic linter-only run and a code-smell run), confirm the WebSocket delivers live status transitions in the run-detail `Table` in both dev and prod modes, confirm the finished run's report renders, the `JsonExplorer` correctly derives table columns from at least two structurally different scanners' raw JSON (e.g. fallow vs. linter), and the findings table filters by severity.
4. Kill and reconnect the WebSocket mid-run (e.g. restart the dev server) and confirm the client's reconnect-with-backoff recovers and status catches up via revalidation.
5. Run a second scan on the same project a day later (or manually insert a second `runs` row) and confirm the trend view shows a correct up/down delta.
6. Attempt to trigger a scan against a path not in `projects.local_path` and confirm it's rejected server-side.
7. Submit the `new-project` and `trigger-scan` `Form`-based forms with both valid and invalid input (e.g. a non-existent local path, no scanners selected) and confirm client-side field errors show instantly, the server-side Zod validation is what actually gates the action, and successful submission produces the expected `projects`/`runs`/`scans` rows.
