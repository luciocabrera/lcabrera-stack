# CodePulse / CQMS — Implementation Status

**What this is:** the living answer to "what is actually built, versus what
[PRD_V2.md](./PRD_V2.md) requires". Everything else in this folder is either the
canonical spec (PRD_V2), a point-in-time artifact (the
[alignment review](./reviews/2026-07-11-codepulse-alignment-review.md)), or
history (PRD.md / PRD_V1.md / TECH_SPEC.md / IMPLEMENTATION_PLAN.md).

**Last verified:** 2026-07-16, against `feat_cqm`.

> Update this page in the same commit as any change that moves a row below.
> It exists because the docs and the running system had drifted apart far
> enough that the drift itself became the main risk (see §3).

---

## 1. Phase status

The phase numbering below is the one from **alignment review §6**, which derives
it from PRD_V2. PRD_V2 itself has no phases — it is 14 requirement sections.

> ⚠️ **`IMPLEMENTATION_PLAN.md` uses a different, older Phase 1/2/3 numbering**
> for the pre-pivot build. The two namespaces are unrelated. When someone says
> "Phase 2", establish which one they mean: containerized execution (here) or
> the dependency graph (that document).

| Phase (review §6)                           | Status          | Evidence                                                                                                                                                                                                                                                                  |
| ------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1 — Ingestion foundation**                | **Done**        | Migrations `0027_project_snapshots.sql`, `0028_api_tokens.sql`; ADR-028/029/031. All three sync channels live: CLI push (`packages/scan-ingestion/src/cli/push.cli.ts`), raw zip upload, browser folder-picker. `PathField`/`PathBrowserModal`/`browseDirectory` deleted. |
| **2 — Containerized, queue-free execution** | **Not started** | No Docker code in `apps/scan-orchestrator/src`. See §3 — the queue PRD_V2 §8 forbids is still the live backbone.                                                                                                                                                          |
| **3 — Scanner platform**                    | **Not started** | No `cqms.files` table (Files epic, §6). `command_template` is still annotated `-- documentation only` in `0015_scanner_registry.sql`; the executable `scanner_command` authority flip (§5) is unmade.                                                                     |
| **4 — Progress & polish**                   | **Not started** | WS payload has no `event_type`/`scanner_type`/`percentage_complete` (§10); no completion webhooks; no 409 banner.                                                                                                                                                         |

Heads: **ADR-032**, migration **`0028_api_tokens.sql`**.

---

## 2. Deliberate, documented deferrals

These are known and recorded — not drift:

- **UUIDv7 defaults + `is_readonly`** — deferred to their own migration (ADR-028 §1). PRD_V2 §4/§5 want UUIDv7; the schema is still v4.
- **Streaming uploads** — the push endpoint buffers the whole archive in memory, bounded by `CQMS_MAX_PUSH_BYTES` (default 500 MB) → 413. Real large-repo support needs streaming (ADR-029, restated ADR-031).
- **Git metadata / diff scoping** — snapshots are whole-tree; diff-based scanning (`code-smell-zen`) is unresolved (ADR-029; PRD_V2 §14.1).
- **DB test order-coupling** — `listApiTokens` / `failStaleRunningScans` pass in the full run but fail as a subset, so there is deliberately no `test:integration` task (`packages/scan-ingestion/vite.config.ts`).
- **Biome as a CQMS scanner** — Biome (ADR-035) gates PRs and emits `reports/biome/full-latest.json`, but its findings do not reach the DB (no scanner row, no `biome_runs` master, not in `linter-checker`). Approved to build, then parked before implementation; execute-ready spec in [`BIOME_SCANNER_PLAN.md`](BIOME_SCANNER_PLAN.md).

---

## 3. Live deviations — where the code and PRD_V2 disagree

**This section is the reason this page exists.** Each item is running code that
does not match the canonical spec. Most are decisions rather than bugs to fix in
isolation.

| #   | Item                                      | State                                                            |
| --- | ----------------------------------------- | ---------------------------------------------------------------- |
| 3.1 | §8 "no queuing" vs the LISTEN/NOTIFY code | **Resolved** — ADR-033; was a misreading, not a conflict         |
| 3.2 | Unsandboxed host execution                | Accepted pre-hosting; Phase 2 fixes it                           |
| 3.3 | `/ws/runs` unauthenticated                | **Built** — ADR-041, short-lived run-scoped subscription tickets |
| 3.4 | Snapshot replaceable under a running scan | **Built** — ADR-034, migration `0029` (pin + retain + collect)   |

### 3.1 The §8 "queue" contradiction — **RESOLVED 2026-07-16 (ADR-033)**

There was no real contradiction, only a misreading. **§8 is admission control
per project, and it is already enforced**: migration
`0021_project_run_concurrency_guard.sql` takes a per-project advisory lock and
rejects a second trigger outright (`ERRCODE 55000`). A user cannot stack runs on
a project — the backlog §8 forbids is already impossible.

The LISTEN/NOTIFY machinery in `apps/scan-orchestrator/src/queue/` is **not** a
backlog: it is the durable, exactly-once hand-off between `admin_system` and the
orchestrator (two processes), plus the per-run parallel scanner pool §9 asks
for. **ADR-026 is retained** — its atomic claim and stale sweep are correctness
machinery for bugs that have each already happened once.

See [ADR-033](./decisions/ADR-033-no-queue-is-per-project-admission-control.md).
§8 and §9 are amended accordingly; the alignment review's "retire the queue"
Phase-2 bullet is annotated as corrected.

**Built (#63, PR #76):** the **`409` surface** — the trigger action maps the DB's
`ERRCODE 55000` to a `409 Conflict` carrying the active `run_id` and elapsed time,
the loader detects an in-flight run to disable the trigger, and both paths render
the shared `ActiveRunNotice` banner linking to the running scan.

**Built (#64):** the **global concurrency cap** — `MAX_CONCURRENT_SCANS` (env var,
default 3) bounds how many scans the orchestrator executes on the host at once
(`runWithConcurrencyLimit` turns the drain into a bounded worker pool). Host
protection, not admission control — scans beyond the cap wait for a slot.

**Still to build (Phase 2):** the run container (§3.2) — see below.

### 3.2 Scanners execute unsandboxed on the host — accepted pre-hosting

[PRD_V2.md](./PRD_V2.md) §9 requires an ephemeral container per run.
`runQueuedScan.ts` spawns scanners directly against `scan.snapshot_path` on the
platform host. Its own comment names this: "Host execution itself is the
Phase-2 (container) item."

Defensible while this is a local internal tool. It is the blocker for PRD_V2 §2
("the server is **not** the developer's machine"), and note §5's executable
`scanner_command` is **remote code execution by design** — the container is what
makes that model safe, so Phase 3 must not land before Phase 2.

### 3.3 `/ws/runs` is unauthenticated — **built (ADR-041)**

Was live; **fixed by [ADR-041](./decisions/ADR-041-ws-runs-subscription-tickets.md)**
(issue #66). The endpoint said so outright — "uuid, no further auth (internal
tool)" — which is a capability check in name only: a run id is unguessable but
not secret, since it sits in the page URL, in loader payloads and in logs.

Subscribing now requires a **short-lived, run-scoped ticket**: an HMAC minted by
`apps/admin_system`'s run-detail loader, which has already put the caller
through the session gate. The orchestrator re-derives the signature for the run
actually being requested — no database in the WebSocket path — so a ticket for
one run cannot be replayed against another, and closes the socket with 1008 on
any failure. Both processes need the same `CQMS_WS_TICKET_SECRET`, which has
**no development default**: a fallback published in this repository would
bypass the control while every check still reported success.

Note what is still open: the orchestrator learns nothing about _who_ is
connected, so there is no per-user logging or rate-limiting here, and a ticket
cannot be revoked before its hour is up. Both are deliberate — see the ADR's
Consequences.

### 3.4 A snapshot can be replaced under a running scan — **built (migration `0029`)**

Was live; **fixed by ADR-034 in migration `0029`** (issue #62). The two failure
modes it closed:

1. **The path is re-resolved, not pinned.** A run carries no snapshot reference;
   `v_queued_scans` joins on `projects.latest_snapshot_id`, so the orchestrator
   reads whatever is latest _at claim time_, not what was triggered. The scan
   analyzes different code under the original run's commit.
2. **The directory is deleted mid-run.** `saveProjectSnapshot` does
   `rmSync(replacedStoragePath, …)` immediately, with no active-run check —
   the files vanish underneath running scanners.

§8's lock does not help: it stops a second **run**, not a **sync**.

**Decision ([ADR-034](./decisions/ADR-034-pin-runs-to-their-snapshot.md)):** pin
the run — add `runs.snapshot_id` (`ON DELETE SET NULL`, because run history is
permanent and `RESTRICT` would make snapshots undeletable forever), resolve
`v_queued_scans` through it, and retain the outgoing snapshot until the run
pinned to it finalizes, then collect. Syncs are never blocked; latest-wins still
governs the next trigger. §8's one-run-per-project lock keeps "is anything still
reading this?" a single-row check, and ADR-026's stale sweep is what makes a
crashed run's snapshot collectable — no orphan reaper needed.

**Built (migration `0029`):** `runs.snapshot_id` captured in `fn_create_run`;
`v_queued_scans` repointed through it; `fn_set_project_snapshot` returns the
replaced path only when no active run pins it (otherwise retains); and
`fn_collect_finished_run_snapshot` — called by the orchestrator after each scan —
returns the collectable path and deletes the row, which the app rmSyncs. A DB-level
test reproduces the original bug (sync mid-run → the run still reads its triggered
tree, and the tree still exists) before asserting collection on finish.

---

## 4. Open questions still awaiting owner sign-off

Carried from PRD_V2 §14 and alignment review §7 — listed here so they are not
lost in a point-in-time document:

1. **Diff-based scanning** — CLI push includes git metadata (branch + merge-base); snapshot-vs-snapshot as fallback; browser uploads whole-tree only.
2. **Dependency install** — per-scanner `needs_install` + shared package-store cache.
3. **Scanner-command RCE** — acceptable only inside the Phase-2 sandbox, permission-gated.
4. **Deterministic scanners on arbitrary projects** — the current runners assume this monorepo's tooling (`vp`, fallow configs), so the four built-ins may be CodePulse-repo-specific definitions rather than platform primitives.
5. **Migration re-baseline vs stacking** — ADR-030 already re-baselined in place for column types; the broader question stands.
6. **Snapshot limits/retention** — max upload size, ignore-rule defaults, per-project disk quota.

---

## 5. Test posture

| Workspace                 | Needs Postgres?                                     | Notes                                                                                                                                                                                 |
| ------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/scan-ingestion` | `test` **yes** / `test:unit`+`test:coverage` **no** | The split is deliberate (ADR-032): the DB-free subset excludes `src/queries/**` and `ingestion/ingestReport.test.ts` so the fallow gate gets real coverage without provisioning a DB. |
| `apps/scan-orchestrator`  | DB-env coupled                                      | Loads `docker/local/.env`; no unit/coverage split.                                                                                                                                    |
| `apps/admin_system`       | **No**                                              | Mock-based, incl. route-action tests.                                                                                                                                                 |
| `packages/server`         | **No**                                              | Pure; `test` + `test:coverage`.                                                                                                                                                       |
| `packages/node-runtime`   | **No**                                              | Pure.                                                                                                                                                                                 |

The fallow audit gate (`fallow audit --gate new-only`) passes with **0 introduced
findings**; accepted debt is recorded in `reports/fallow/baselines/`. One
`packages/ui` duplication entry remains baselined against the vital-package rule
— see the WP7 commit.
