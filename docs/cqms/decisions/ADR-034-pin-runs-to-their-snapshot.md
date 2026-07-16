# ADR-034: Pin a run to its snapshot id; retain that snapshot until the run finishes, then collect it

**Status:** Accepted (owner decision, 2026-07-16) — **specified, not yet implemented.**
**Amends:** [PRD_V2.md](../PRD_V2.md) §3 (qualifies "old snapshots are not retained"), ADR-028 (adds the run→snapshot pin the snapshot model left out).
**Fixes:** [STATUS.md](../STATUS.md) §3.4, found while settling [ADR-033](./ADR-033-no-queue-is-per-project-admission-control.md).

## Context

PRD_V2 §3 is **sync-then-scan, latest wins**: each sync replaces the project's
snapshot, and old snapshots are not retained ("run history keeps metrics, not
code"). ADR-028 implemented exactly that, and nothing anywhere guards a sync
that lands **while a run is in flight**.

Two separate failures follow, and the second is worse than the first:

1. **The path is re-resolved, not pinned.** A run carries no snapshot
   reference at all. `cqms.v_queued_scans` resolves `storage_path` by joining
   `project_snapshots` on **`projects.latest_snapshot_id`**, so the orchestrator's
   `scan.snapshot_path` is whatever is latest _at claim time_ — not what the
   user triggered on. Sync between trigger and claim and the scan silently
   analyzes different code, attributed to the run's original commit.

2. **The directory is deleted out from under a running scan.**
   `fn_set_project_snapshot` hands the replaced snapshot's `storage_path` back
   to the caller, and `saveProjectSnapshot` immediately does
   `rmSync(replacedStoragePath, { force: true, recursive: true })` with no
   active-run check. Scanners reading that tree lose their files mid-run.

§8's per-project lock does not help: it stops a second **run**, not a **sync**.
Both are live today.

## Decision

**Pin the run to a snapshot id at trigger time, and defer collection until the
run that pinned it finishes.**

### 1. `runs.snapshot_id` — the pin

Add `runs.snapshot_id uuid REFERENCES cqms.project_snapshots(id) ON DELETE SET NULL`,
captured from `projects.latest_snapshot_id` inside
`fn_create_run_with_scoped_scans` — in the same transaction as the §8 advisory
lock, so the pin and the admission decision cannot disagree.

`v_queued_scans` then resolves `snapshot_path` through **`runs.snapshot_id`**,
never `projects.latest_snapshot_id`. A run analyzes the code it was triggered
on, whatever syncs land afterwards.

**`ON DELETE SET NULL`, deliberately — not `RESTRICT`.** Run history is kept
forever (§3: "run history keeps metrics, not code"), so a `RESTRICT` FK would
make every snapshot permanently undeletable: the very thing §3 forbids. `SET
NULL` lets a historical run keep its metrics while its code is collected. A
`NULL` `snapshot_id` on a finished run means "collected", which is the normal
end state, not an error.

### 2. Retention until the run finishes

`fn_set_project_snapshot` stops unconditionally returning the replaced path.
It returns `replaced_storage_path` **only when no run in `('queued','running')`
pins the replaced snapshot**; otherwise it returns `NULL` and the snapshot
survives the pointer swap.

The sync itself is never blocked. Latest-wins is preserved exactly: the new
snapshot becomes latest immediately, the next trigger uses it, and only the
_bytes_ of the outgoing snapshot linger — and only for as long as something is
reading them.

### 3. Collection when the run finalizes

`fn_finalize_run_status` (0002/0018) becomes the collection point: on
finalizing a run it returns the `storage_path` of any snapshot that is now
collectable — **not** the project's `latest_snapshot_id`, and with **no**
remaining `queued`/`running` run pinned to it — and deletes the row. The
orchestrator performs the `rmSync`, keeping ADR-028's split intact: **the DB
owns the pointer, the app owns the filesystem.**

Two existing mechanisms make this cheap rather than a refcounting problem:

- **§8's per-project lock** ([ADR-033](./ADR-033-no-queue-is-per-project-admission-control.md))
  caps a project at one active run, so "is anything still reading this?" is a
  single-row check, not a refcount.
- **ADR-026's stale-run sweep** is what unblocks collection after a crash: an
  orchestrator that dies mid-run leaves a pinned snapshot, and the startup
  sweep fails that run — which makes its snapshot collectable through the same
  path as a normal finish. No separate orphan reaper.

## Consequences

- Disk holds at most **one extra snapshot per project**, and only while that
  project has an active run — bounded by §8, not by usage.
- `rmSync` in `saveProjectSnapshot` becomes conditional on what the DB returns;
  the guard lives in one place (the function), not spread across callers.
- A crashed orchestrator leaves one snapshot until the next orchestrator start
  sweeps its run. Acceptable: bounded, self-healing, no new machinery.
- Existing runs (pre-migration) get `snapshot_id = NULL`, which reads correctly
  as "code already collected".
- Snapshot storage needs a size/retention policy regardless — still open, see
  STATUS.md §4.

## Alternatives rejected

- **Reject the sync while a run is active.** Simplest, and symmetrical with
  §8's 409. Rejected: it blocks a legitimate push for the duration of someone
  else's scan, and it contradicts latest-wins — a sync is not a scan and should
  not queue behind one. It also solves the smaller half of the problem
  (re-resolution) while leaving the user unable to do the thing they asked for.
- **Copy-on-trigger** (snapshot the tree into a per-run directory). Correct and
  needs no retention rule, but doubles disk and I/O on every run to fix a race
  that a foreign key fixes for free.
- **`ON DELETE RESTRICT` + never delete.** Rejected: run history is permanent,
  so this retains every snapshot forever — exactly what §3 rules out.

## Implementation notes (not yet done)

Migration `0029`: add `runs.snapshot_id`; capture it in
`fn_create_run_with_scoped_scans`; repoint `v_queued_scans` at
`runs.snapshot_id`; make `fn_set_project_snapshot`'s replaced-path return
conditional; extend `fn_finalize_run_status` to return collectable paths.
App side: `saveProjectSnapshot` keeps its `rmSync` but only for a non-NULL
return; the orchestrator collects on finalize.

Worth a test that reproduces the current bug first: trigger a run, sync a new
snapshot mid-run, and assert the run still reads the tree it was triggered on
and that the tree still exists.
