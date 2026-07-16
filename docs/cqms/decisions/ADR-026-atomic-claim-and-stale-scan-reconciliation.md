# ADR-026: Atomic queue claim + stale-'running' reconciliation

**Status:** **Accepted — and explicitly retained** ([ADR-033](./ADR-033-no-queue-is-per-project-admission-control.md), owner decision 2026-07-16). Not superseded.

> **✅ This ADR stands. Do not retire this machinery.**
>
> It was briefly read as superseded: [PRD_V2.md](../PRD_V2.md) §8 says "**No
> queuing, ever**", and the
> [alignment review](../reviews/2026-07-11-codepulse-alignment-review.md)
> turned that into a Phase-2 task to discard this ADR's claim/reconciliation
> machinery outright.
>
> [ADR-033](./ADR-033-no-queue-is-per-project-admission-control.md) settled it
> the other way, because §8 is **admission control per project** — and that
> rule is already enforced in Postgres by migration
> `0021_project_run_concurrency_guard.sql`, which rejects a second trigger
> outright. **A backlog is already impossible.** What this ADR owns is not a
> backlog but the durable, exactly-once hand-off between `admin_system` and
> `apps/scan-orchestrator` — two processes that still need one — plus the
> per-run parallel scanner pool §9 asks for.
>
> The machinery below is **correctness**: the atomic claim exists because a
> duplicate orchestrator really did execute the same scans twice, and the stale
> sweep because a dead orchestrator left scans `running` forever. Neither
> problem goes away under §8. What §8 still needs built is only its _surface_ —
> the `409` payload, the live trigger-disable, and the alert banner.

## Context

Two operational gaps were documented as future work when the orchestrator
landed (ADR-015, reiterated in ADR-021) and both bit during Phase 3:

1. `fn_mark_scan_running` transitioned unconditionally, so exactly-once
   execution rested entirely on there being a single orchestrator
   process. A duplicate listener happened live (a leftover dev
   orchestrator next to a new one) and executed the same scans twice.
2. A scan whose orchestrator died mid-run stayed `'running'` forever —
   never re-queued, never failed, its run never finalized. Also happened
   live (a killed dev orchestrator mid-app-graph-scan).

## Decision

### 1. `fn_claim_queued_scan` replaces `fn_mark_scan_running` (migration 0018)

The queued → running transition is now a **claim**:
`UPDATE … WHERE id = p_scan_id AND status = 'queued'` returning `FOUND`.
Under READ COMMITTED a concurrent claimer blocks on the row lock,
re-evaluates the predicate against the winner's committed `'running'`
value, matches nothing and gets FALSE — the row's own status transition
is the arbiter, no advisory locks or `SKIP LOCKED` machinery needed for
a one-at-a-time queue. `runQueuedScan` claims first and silently skips a
lost claim, so a duplicate orchestrator (or an overlapping wake) is now
harmless for correctness. The old function is DROPped per ADR-018's
precedent — stale callers fail loudly rather than keeping the racy path
alive.

### 2. `fn_fail_stale_running_scans` — startup reconciliation (0018)

The orchestrator calls it ONCE at startup, **before** it begins
listening/claiming: at that moment every `'running'` row is necessarily
stale, because a single active orchestrator is the deployment model
(ADR-015). The sweep fails them set-wise with a clear re-trigger message
and finalizes each affected run (`fn_finalize_run_status` correctly
leaves runs with still-queued siblings at `'running'` — the startup
drain picks those up normally).

**Deliberately NOT re-queued**: a stale scan may be an LLM agent scan
that already burned minutes of API credit; silently re-running it spends
real money without a human deciding to. Failed-with-reason + manual
re-trigger is the conservative default; auto-requeue for deterministic
scanners only is a cheap later enhancement if it earns its keep.

**Multi-instance caveat**: with two orchestrators deliberately running,
instance B's startup would sweep instance A's in-flight scans. The claim
makes concurrent _draining_ safe, but startup reconciliation still
assumes a single active orchestrator. HA needs a lease/heartbeat
(`claimed_by`/`heartbeat_at` + timeout) — out of scope for a
single-process internal tool.

### 3. Test-suite serialization

The sweep is the suite's first globally-scoped mutation: it fails EVERY
`'running'` scan, including one another test file briefly holds (vitest
runs files in parallel workers). The three affected files
(`claimQueuedScan`, `failStaleRunningScans`, `markScanFailed`) serialize
via `acquireAdvisoryTestLock` — a session-level `pg_advisory_lock` held
on a dedicated pool client (lock and unlock must run on the SAME
connection; `pool.query` may braid statements across clients).

## Verification performed

- Real-DB tests: first claim wins (running + started_at), later claims
  lose without clobbering started_at; the sweep fails a claimed scan,
  leaves queued siblings alone, keeps their run at 'running', and is a
  0-count no-op when nothing runs. Orchestrator E2E test extended: a
  second `runQueuedScan` pass over the same scan publishes nothing and
  leaves it succeeded.
- **Live crash E2E**: triggered a repo-wide app-graph scan through the
  UI, SIGKILLed the orchestrator mid-run (scan verified stuck at
  'running' — the exact documented gap), restarted → startup logged
  `🧹 Failed 1 stale 'running' scan(s)`, scan failed with the re-trigger
  message, run finalized; re-triggering the scanner then succeeded
  through the claim path.
- Suites: scan-ingestion **182/182**, scan-orchestrator **9/9**,
  admin_system untouched; lint + typecheck clean; migration 0018 applied
  to live `cqms_db`.
