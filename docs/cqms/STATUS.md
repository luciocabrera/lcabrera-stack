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

---

## 3. Live deviations — where the code and PRD_V2 disagree

**This section is the reason this page exists.** Each item is running code that
does not match the canonical spec. Most are decisions rather than bugs to fix in
isolation.

| #   | Item                                      | State                                                    |
| --- | ----------------------------------------- | -------------------------------------------------------- |
| 3.1 | §8 "no queuing" vs the LISTEN/NOTIFY code | **Resolved** — ADR-033; was a misreading, not a conflict |
| 3.2 | Unsandboxed host execution                | Accepted pre-hosting; Phase 2 fixes it                   |
| 3.3 | `/ws/runs` unauthenticated                | Accepted pre-hosting; Phase 2 fixes it                   |
| 3.4 | Snapshot replaceable under a running scan | **Open** — a live correctness hole, needs a call         |

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

**Still to build (Phase 2), narrower than it looked:**

- The **`409` surface**: there is no `409` anywhere in `apps/admin_system/src` — the DB's rejection currently reaches the UI as a generic form error. §8 wants a `409 Conflict` carrying the active `run_id` and elapsed time, plus a live-status trigger-disable and an alert banner.
- A **global concurrency cap** (env var): nothing limits how many runs execute at once platform-wide. Host protection, not admission control — runs beyond the cap wait.

### 3.2 Scanners execute unsandboxed on the host — accepted pre-hosting

[PRD_V2.md](./PRD_V2.md) §9 requires an ephemeral container per run.
`runQueuedScan.ts` spawns scanners directly against `scan.snapshot_path` on the
platform host. Its own comment names this: "Host execution itself is the
Phase-2 (container) item."

Defensible while this is a local internal tool. It is the blocker for PRD_V2 §2
("the server is **not** the developer's machine"), and note §5's executable
`scanner_command` is **remote code execution by design** — the container is what
makes that model safe, so Phase 3 must not land before Phase 2.

### 3.3 `/ws/runs` is unauthenticated — Phase 2 item

`apps/scan-orchestrator/src/ws/attachWebSocketServer.ts` says so outright:
"uuid, no further auth (internal tool)". PRD_V2 §12 requires auth; the review
lists "Authenticate `/ws/runs`" under Phase 2. Same reasoning as 3.2: fine for a
local tool, real exposure once hosted.

### 3.4 A snapshot can be replaced under a running scan — unguarded, live

Nothing blocks a sync while a run is active. Trigger a scan against snapshot A,
push snapshot B mid-run, and the running scanners read code swapped underneath
them; the findings get attributed to the wrong commit.

§8's lock does not help — it only stops a second **run**, not a **sync**.
`0027_project_snapshots.sql` has no run-active guard, and §3's "latest wins, old
snapshots are not retained" makes replacement the normal path rather than an edge
case.

Found 2026-07-16 while settling §3.1
([ADR-033](./decisions/ADR-033-no-queue-is-per-project-admission-control.md),
"What this does not fix"). Live today and independent of the queue decision.
**Needs a call:** reject the sync while a run is active, or pin the run to its
snapshot id and let syncs proceed. The second fits "latest wins" better but means
retaining a snapshot until its run finishes — which cuts against "old snapshots
are not retained".

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
| `packages/data-access`    | **No**                                              | Pure; `test` + `test:coverage`.                                                                                                                                                       |
| `packages/node-runtime`   | **No**                                              | Pure.                                                                                                                                                                                 |

The fallow audit gate (`fallow audit --gate new-only`) passes with **0 introduced
findings**; accepted debt is recorded in `reports/fallow/baselines/`. One
`packages/ui` duplication entry remains baselined against the vital-package rule
— see the WP7 commit.
