# CodePulse — Product Requirements v2 (Canonical)

**Status:** Canonical yardstick, confirmed with the product owner on 2026-07-11.
**Supersedes:** [PRD.md](./PRD.md) (initial Phase-1 draft, kept for history) and distills [PRD_V1.md](./PRD_V1.md) (working transcript) plus the decisions resolved in review Q&A.
**Working title:** CodePulse — Multiverse Code Quality Tracker (currently implemented under the internal name CQMS).
**Implementation status:** [STATUS.md](./STATUS.md) — what is actually built against this document, including the places where **live code contradicts it** (notably §8's no-queue/409 contract) and the §14 questions still awaiting sign-off. This document says what CodePulse _should_ be; STATUS.md says where it _is_.

## 1. Executive Summary

CodePulse is a **centrally hosted** code quality and static analysis platform that tracks, analyzes, and quantifies code health across multiple repositories over time. It bridges deterministic tooling (linters, type-checkers) and generative AI analysis (agentic LLM reviewers), turning raw tool output and AI observations into structured historical insight: _is our code getting better or worse?_ An always-on AST graph engine additionally maps each codebase's architecture to power dependency analysis and agentic skills.

## 2. Deployment & Access Model (resolved 2026-07-11)

- **Hosted, multi-developer platform** (think `codepulse.net`): the server is _not_ the developer's machine.
- **Auth/RBAC is core product**: login, roles, permissions, and user administration (already built as ADR-017/018/024) are requirements, not overshoot. Every mutating flow records the acting user (`created_by`, `run_executed_by`, …).
- **The platform never exposes its own filesystem to users.** No server-side path browsing, no registering server paths. (Replaces the local-path model; ADR-014's browse flow is superseded.)

## 3. Code Ingestion (resolved 2026-07-11)

- A project's code **syncs from the developer's machine to the platform**; scans execute server-side.
- **Two sync channels, both from day one:**
  1. **CLI push** (primary): a CodePulse CLI run inside the repo packs the tree (honoring ignore rules) and pushes it to the platform. Scriptable, handles real repo sizes, usable from CI.
  2. **Browser archive upload** (fallback): the web UI accepts a zip/tar per project, for small projects and zero-install situations.
- **Sync-then-scan, latest wins:** syncing is its own step; each sync **replaces** the project's current snapshot. "Trigger Scan" always runs against the latest snapshot; triggering with no snapshot is an error. Old snapshots are not retained (run history keeps metrics, not code).
- **A run is pinned to the snapshot it was triggered on** ([ADR-034](./decisions/ADR-034-pin-runs-to-their-snapshot.md), 2026-07-16). "Latest wins" governs what the **next trigger** scans — it must not redirect a run already in flight. A sync during an active run is never blocked and the new snapshot becomes latest immediately; the **outgoing snapshot's bytes are retained until the run pinned to it finishes**, then collected. So "old snapshots are not retained" means _not retained beyond the last run reading them_ — never "deleted out from under a running scan". Disk holds at most one extra snapshot per project, bounded by §8's one-active-run-per-project lock.
- **Clean break from `local_path`:** existing path-registered projects/scan history are dev data — dropped, not migrated.
- Remote-repository pull (git URL) remains a **future iteration** behind the same ingestion abstraction.

## 4. Projects

One project = **one repository, many machines**. Any authorized member may sync and trigger runs; the originating machine/user is recorded as sync/run metadata, and trend lines aggregate across contributors.

Schema (from PRD_V1, corrected): `project_id` (UUIDv7 PK), `project_name` (required), `project_description`; **snapshot reference replaces `project_path`** (latest snapshot id, synced_at, synced_by, source machine label); audit attributes (`created_at/by`, `modified_at/by`, `is_disabled`, `is_deleted` soft-delete, `is_readonly`); aggregates (`last_run_at`, `last_run_status`, `project_runs_number`, `project_scanners_number`).

CRUD with soft delete (hidden from primary UI, retained for history). Scan invocation panel lets the user multi-select the project's configured scanners.

## 5. Scanners

Three types share a registry: `scanner_id` (UUIDv7 PK), `scanner_name` (human-readable, UI-facing), `scanner_description`, audit attributes, aggregates (`last_run_at`, `last_run_status`, `scanner_runs_number`).

- **Type 1 — Deterministic (CLI tools):** `scanner_command` (e.g. `npx eslint . --format=json`, `oxlint`, `tsc --noEmit`). Runs inside the run container's shell; stdout/stderr captured and routed to the ingestion parser.
- **Type 2 — LLM (agentic evaluators, compile to Claude Skills):**
  - `scanner_skill_name` — the literal Claude skill identifier (snake_case, alphanumeric + underscores, starts with a letter); dictates the skill folder name and frontmatter id.
  - `scanner_skill_description` — read by the LLM; the routing guide saying when to run the skill, what it does, and its boundaries.
  - Asset linkage: M2M to Files (§6) with target vector `script` (`/scripts`) or `resource` (`/resources`).
  - Executes via the platform's Agent SDK runtime on a **platform-managed API key** — LLM usage is centrally metered, billed, and capped (existing LLM-usage tracking + daily-cap logic stays authoritative).
- **Type 3 — System Graph Scanner (read-only, always-on):** hidden from selection lists; runs automatically on **every** run ("Continuous Shadow Graph" — users cannot disable it). AST sweep (Oxlint/SWC/Tree-sitter class tooling) capturing directories, files/components, functions, variables, down to argument signatures; must answer hierarchical queries fast (e.g. "how many functions under `src/components/Button`?").

**Dual-purpose asset architecture:** the DB is the source of truth for skill instructions/scripts/resources (the platform runner reads them from tables); the platform can additionally **export** a scanner as a physical Claude-skill folder (`<scanner_skill_name>/` + frontmatter + `/scripts` + `/resources`) so external agents can consume the same workflow.

## 6. Files Management (Skill Assets)

Custom auxiliary artifacts (scripts, JSON context docs, prompts) registered via the UI and stored in the DB: `file_id` (UUIDv7 PK), `file_name`, `file_description`, `file_extension`, audit attributes. M2M binding to LLM scanners with per-link `type: script | resource`.

## 7. Runs, Scans & Outputs (three layers)

- **Run (master):** `run_id` (UUIDv7 PK), `project_id` FK, executed/started/finished timestamps, `run_executed_by`, `run_status` (`PROCESSING | COMPLETED | FAILED`), `run_files_number`, `run_scanners_executed`, audit attributes.
- **Scan (per-scanner job):** compound key (`run_id`, `scanner_id`), `scan_status` (`PENDING | RUNNING | SUCCESS | FAIL`), started/finished timestamps, per-engine metrics block (deterministic: errors/warnings/duration; LLM: tokens, flaws found, adherence score).
- **Scan Details (output store):** raw output logs for debugging **plus** the standardized mapping — a normalized findings array (line numbers, severity, affected snippets, summaries) in one uniform JSON schema for every scanner type (**Standardization Mandate**).

## 8. Concurrency: Per-Project Lock, No Queue

> **Scope, clarified 2026-07-16 ([ADR-033](./decisions/ADR-033-no-queue-is-per-project-admission-control.md)):** this rule is **admission control per project**. It governs whether a _trigger_ is accepted — it is **not** a ban on the platform's internal work hand-off between the web process and the orchestrator (LISTEN/NOTIFY + atomic claim + stale-run sweep, ADR-026), nor on the per-run parallel scanner pool of §9. Those stay: they are exactly-once/durability machinery, and under the per-project lock a `queued` scan is a brief transient inside one accepted run, never a backlog. Read "no queuing" without this scope and you delete the guard that stops a duplicate orchestrator executing the same scans twice.

- Lock is **strictly per project**: a run on Project A blocks only Project A; other projects run concurrently without restriction.
- **No queuing, ever** (anti-abuse): a trigger against a project with an active run is **instantly rejected** — API returns `409 Conflict` with the active `run_id` and elapsed time; the UI disables the trigger via live status and shows an alert banner if a race slips through.
- **Why it is not merely anti-abuse:** §3 is latest-wins — each sync replaces the snapshot and old ones are not retained. A queued run would execute against whatever snapshot exists when it finally starts, not the one it was triggered on, silently scanning code nobody asked about and attributing it to the wrong commit. Rejecting is the _correct_ behaviour, not just the defensive one.
- **Already enforced in Postgres:** migration `0021_project_run_concurrency_guard.sql` takes a per-project advisory lock and rejects a second trigger with `ERRCODE 55000`. What remains to build is the surface — the `409` payload, the live trigger-disable, and the alert banner.

## 9. Execution Environment: Ephemeral Container per Run (resolved 2026-07-11)

Each run executes in a **disposable Docker container**: provision → unpack the project's latest snapshot → install dependencies → execute the Graph Scanner, all selected deterministic scanners, and all selected LLM scanners **in parallel** → stream progress events → persist standardized outputs → destroy the container. The sandbox protects the **platform host** (it executes user-defined shell commands and skill scripts).

Orchestration: acquire project lock (or 409) → parallel pool → join, standardize, persist, update aggregates, release lock. Workers that exceed timeout thresholds are failed and the run still finalizes.

**Global concurrency cap (added 2026-07-16, [ADR-033](./decisions/ADR-033-no-queue-is-per-project-admission-control.md)):** §8 caps each project at one run, but nothing caps the platform. With N projects each legitimately running their one allowed run, N containers start at once. A **global concurrency limit, configured by env var**, bounds how many runs execute simultaneously; runs beyond it **wait** rather than being rejected. This is host protection, not admission control — the wait is bounded by the number of projects, not by anything a single user can do, so it does not reopen what §8 closes. Rejecting instead (503 + `Retry-After`) is the fallback if a bounded wait ever proves abusable.

_Proposed implementation details (accept/override at review):_ base-image + package-store caching to keep installs fast; CPU/memory/wall-clock limits per run; network egress blocked during scanner execution (open only for the dependency-install phase); container teardown guaranteed by the finalizer even on failure.

## 10. Live Progress Notification Engine

Event-driven status streaming from run workers to the UI, channel scoped per project (SSE or WebSocket, e.g. `/api/projects/{id}/live-status`). Uniform event payload: `run_id`, `project_id`, `timestamp`, `event_type` (`SCANNER_STARTED | SCANNER_PROGRESS | SCANNER_COMPLETED | SCANNER_FAILED | RUN_FINALIZED`), `scanner_id`, `scanner_type` (`GRAPH | DETERMINISTIC | LLM`), `message`, `percentage_complete`.

UI: project processing banner (master timer + per-task progress), collapsible live console log (graph node counts, deterministic stdout snippets, LLM agent steps), and completion notifications (toast/webhook) with quick stats.

## 11. Core User Flows

**Developer — run & remediate:** log in → open project → (if code changed) sync via CLI push or archive upload → Trigger Scan, multi-select scanners → platform acquires the project lock, spins up the run container, executes graph + scanners in parallel → live progress streams to the UI → on completion, delta lines vs the previous run and refreshed dashboards.

**Product owner — health dashboard:** open analytics → filter across projects → review quality trends over release windows (improving/declining indicators).

## 12. Non-Functional Requirements

- **Performance:** deterministic scanners stream output promptly; container startup/install overhead minimized by caching.
- **Isolation/Security:** all scanner execution sandboxed in the per-run container; RBAC on every route and mutation; platform-managed LLM keys never leave the server; CLI authenticates with revocable per-user tokens _(proposed)_.
- **Database scaling:** graph tables (function/argument granularity) heavily indexed (recursive CTEs / hierarchical indexing) for fast parent-child queries.

## 13. Non-Goals & Future Iterations

- **Non-goal:** run queuing (explicitly rejected — instant 409 instead).
- **Non-goal:** exposing the platform host's filesystem to users in any form.
- **Future:** remote-repository pull ingestion (git URL) behind the ingestion abstraction; CI-triggered runs; browser-upload size/UX improvements.

## 14. Proposed Resolutions Awaiting Confirmation

1. **Diff-based scanning** (today's `code-smell-zen`): uploaded snapshots carry no git history by default. Proposal: CLI push includes minimal git metadata (current branch + merge-base of the target branch) so diff scans keep working; snapshot-vs-snapshot diffing is the fallback where git data is absent. Browser uploads support whole-tree scans only.
2. **Dependency install** (§9): container runs the project's package-manager install with a shared cache; a per-scanner `needs_install` flag lets install-free runs (oxlint-only, graph-only) skip it.
3. **CLI authentication:** per-user revocable API tokens issued from the profile page, scoped to sync + trigger.
4. **Graph scanner placement:** runs inside the container against the snapshot, emitting a graph artifact the host ingests transactionally (keeps DB writes out of the sandbox).
