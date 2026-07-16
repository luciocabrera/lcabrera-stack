# ADR-033: "No queuing, ever" is per-project **admission control** — the internal hand-off stays, and host capacity gets its own cap

**Status:** Accepted (owner decision, 2026-07-16)
**Amends:** [PRD_V2.md](../PRD_V2.md) §8 (scopes the rule), §9 (adds a global concurrency cap).
**Rescues:** ADR-026 — the [alignment review](../reviews/2026-07-11-codepulse-alignment-review.md) read §8 as "discard ADR-026's machinery outright"; this ADR corrects that reading. ADR-026 stays.

## Context

[PRD_V2.md](../PRD_V2.md) §8 says, in full:

> - Lock is **strictly per project**: a run on Project A blocks only Project A.
> - **No queuing, ever** (anti-abuse): a trigger against a project with an
>   active run is **instantly rejected** — API returns `409 Conflict` with the
>   active `run_id` and elapsed time.

The alignment review turned that into a Phase-2 task: _"Replace queue: retire
`0007_scan_queued_notify`, `claimQueuedScan`, `failStaleRunningScans`,
`listenForQueuedScans` drain loop."_ [STATUS.md](../STATUS.md) §3.1 logged the
resulting spec-vs-code contradiction as an open owner decision.

Investigating it (2026-07-16) turned up three facts that change the question:

1. **The anti-abuse rule is already enforced, in Postgres.** Migration
   `0021_project_run_concurrency_guard.sql` takes
   `pg_advisory_xact_lock(hashtextextended(project_id))`, then rejects outright
   if any run for that project is `queued`/`running`
   (`ERRCODE 55000`). Runs are inserted straight to `running`. **A user cannot
   stack runs on a project today.** The abuse §8 fears is already impossible;
   what is missing is only the _surface_ (a `409` with the active `run_id` and
   elapsed time — there is no `409` anywhere in `apps/admin_system/src` — plus
   the live trigger-disable and alert banner).

2. **The LISTEN/NOTIFY machinery is not a backlog.** `admin_system` (web) and
   `apps/scan-orchestrator` are separate processes; the queue is the durable
   hand-off between them, plus the per-scan fan-out _within one accepted run_ —
   which is exactly the "parallel scanner pool" §9 asks for. With 0021 in
   force, at most **one run per project** is ever in flight. Retiring the
   hand-off would not remove a backlog; it would remove the transport.

3. **ADR-026's machinery is correctness, not queuing.** Its atomic claim exists
   because a duplicate orchestrator **really did execute the same scans twice**;
   its stale sweep exists because an orchestrator that died mid-run left scans
   `running` forever. Two processes and an exactly-once requirement do not go
   away under §8. Deleting that code re-earns both bugs.

A fourth fact reframes _why_ the rule is right. §3 is "sync-then-scan, **latest
wins**": each sync replaces the snapshot and old snapshots are not retained. A
queued run would execute against whatever snapshot exists **when it finally
runs**, not the one it was triggered on — silently scanning code nobody asked
about and attributing it to the wrong commit. That is a **correctness**
argument for no-queue, and it is stronger than the anti-abuse one because it
does not depend on anyone behaving badly.

## Decision

**1. §8 is an admission-control rule, scoped per project.** A trigger against a
project with an active run is rejected instantly — never enqueued. This is
already true (0021); what gets built is the surface:

- `409 Conflict` carrying the active `run_id` and elapsed time.
- The UI disables the trigger from live status, and shows an alert banner if a
  race slips through.

The DB guard stays the authority; the `409` is how it reaches an API caller,
the same way Postgres' typed rejections already reach the forms.

**2. The internal work hand-off stays, and is explicitly _not_ "queuing".**
`0007_scan_queued_notify`, `listenForQueuedScans`, `processQueue`,
`claimQueuedScan` and `failStaleRunningScans` are retained as the durable,
exactly-once transport between the web process and the orchestrator, and as the
per-run parallel scanner pool. **ADR-026 is not superseded.** Under §8's lock a
`queued` scan is a brief transient inside one accepted run, not a backlog.

**3. Host capacity gets its own cap, separate from §8.** There is no global
concurrency limit anywhere today: with N projects each legitimately running
their one allowed run, N container runs start at once. That is a §9
host-protection concern, not an abuse concern. Add a **global concurrency cap
via env var**; when it is reached, runs **wait** rather than being rejected.

Waiting at the global cap is deliberately _not_ a violation of rule 1: the
backlog it can produce is bounded by the number of projects, not by anything a
single user can do, because per-project admission is still capped at 1.
Rejecting instead would punish a legitimate user for other people's load.

## Consequences

- Phase 2's "replace queue" task is **cancelled** and replaced by: build the
  `409` surface, add the global cap, and move execution into the container.
  The review's Phase-2 bullet is annotated accordingly.
- ADR-026 keeps its Accepted status with no supersession.
- "No queuing, ever" must always be read with its scope attached. The bare
  phrase invites deleting the double-execution guard — which is precisely what
  the review's reading proposed.
- The global cap needs a value and a wait-vs-reject surface (`Retry-After` if
  ever flipped to reject); both are Phase-2 work.

## What this does not fix

**A snapshot can still be replaced under a running scan.** Nothing guards a
sync while a run is active: trigger against snapshot A, push snapshot B
mid-run, and the running scanners read code swapped underneath them. §8's lock
does not help — it only stops a second _run_. This is live today, independent
of this decision; see [STATUS.md](../STATUS.md) §3.4.

## Alternatives rejected

- **Retire the queue as the review proposed.** Rejected: it deletes the
  cross-process transport and ADR-026's exactly-once guarantee to remove a
  backlog that 0021 already prevents. It would re-earn two bugs that each
  already happened live during Phase 3 (a leftover dev orchestrator executing
  the same scans twice; a killed dev orchestrator leaving a scan `running`
  forever) — dev incidents, but ones a hosted deployment makes likelier, not
  less.
- **Reject at the global cap (503 + `Retry-After`).** Philosophically tidier,
  but it fails a legitimate user because of unrelated load on other projects.
  Kept as the fallback if a bounded wait ever proves abusable.
- **Amend §8 to permit queuing.** Rejected — the per-project rule is right, and
  "latest wins" makes a per-project backlog actively incorrect, not merely
  wasteful.
