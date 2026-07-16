# ADR-016: `resolveLocalPath` for UI-driven project paths + scan-status toast notifications

**Status:** **Superseded (resolver half — code retired)**; Accepted (scan-status toasts — still live).

> **⚠️ Split verdict (2026-07-11).** The **`resolveLocalPath` / path-based
> project-matching half is superseded and retired**: ADR-028 dropped
> `projects.local_path`, so there is no path to canonicalize or match against.
> Ad hoc ingestion now **requires `--project-id`** and throws without it — see
> the comment in `packages/scan-ingestion/src/ingestion/resolveScan.util.ts`
> ("Path-based match-or-create retired with the local_path model (ADR-028)").
>
> The **scan-status toast half is unaffected** and still ships. Current state:
> [STATUS.md](../STATUS.md).

## Context

Two real-usage bug reports against the completed Step 9 system, from the
same session:

1. **Editing a project's `local_path` to a subfolder silently did
   nothing.** The user re-pathed a registered project from
   `/home/lucio/workspaces/vite-react-compiler` to
   `.../vite-react-compiler/packages/ui` via the edit form; the form
   submitted successfully, but the DB row (confirmed by direct query)
   still held the repo root. Root cause: `registerProject`/`updateProject`
   both reused `resolveProjectPath` (`matchProject.util.ts`), whose
   `git rev-parse --show-toplevel` walk canonicalizes **any** path inside
   a git repo back to that repo's root. Since `packages/ui` lives inside
   the same repo, the "new" path canonicalized to the unchanged old one —
   the UPDATE was a no-op in effect, with no error anywhere.
2. **A failed scan produced no user-facing signal at all.** The user's
   second real run ended `partially_failed` (3 of 4 scans failed —
   themselves a direct consequence of bug 1: the still-root `local_path`
   was correctly rejected by `assertSafeTargetPath`), but the UI showed
   nothing beyond the status cell quietly changing. Explicit direction:
   "if there is an error we should notify, not just do nothing."

## Decision

### 1. Two path resolvers with deliberately distinct charters

`resolveProjectPath`'s git-root walking is **correct for exactly one
caller**: the ad hoc interactive-session path (`resolveScan.util.ts`'s
create-project-and-run-on-the-fly flow), where a skill invoked from any
subdirectory of a repo should attach its scan to that repo's project.
It is **wrong** for UI-driven register/edit, where the user picked a
specific folder and means exactly that folder — including a subfolder of
a repo that is (or could be) registered separately at its root.

New `ingestion/resolveLocalPath.util.ts`: realpath-only canonicalization
(symlinks, `.`/`..` — via the shared `fs/canonicalRealPath.util.ts`), no
git awareness. `registerProject`/`updateProject` now call it instead of
`resolveProjectPath`. It also doubles as the filesystem-existence check
(realpath throws for a missing path, surfaced as the caller-facing
"Path does not exist" error) — the Node-only validation Zod structurally
cannot do at the action boundary (TECH_SPEC §2.4).

Not chosen: making `resolveProjectPath` configurable (a
`walkToGitRoot: boolean` flag). The two behaviors serve different
callers with different trust models and never mix — two small,
single-purpose utils are clearer than one flag-switched one, and the
docstrings on each now name the other explicitly so the next reader
can't reuse the wrong one by accident again.

### 2. `useRunStatusSocket` surfaces terminal scan transitions as toasts

`admin_system`'s run-detail WebSocket hook now parses incoming messages
and, on a `type: 'scan-status'` payload reaching a terminal state, calls
`useNotifyAction` (`@repo/ui/contexts/NotificationContext`):
`status: 'failed'` → an error toast naming the scanner ("Open the scan
for details"), `status: 'succeeded'` → a success toast. Non-terminal
messages (`scan-progress`, intermediate statuses) and malformed JSON
notify nothing.

Two boundaries deliberately preserved:

- **The socket stays a cache-invalidation signal, not a data channel**
  (ADR-015). The WS payload's `scannerId`/`status` are used only to
  _label_ a toast; every rendered data shape still comes from the loader
  via `revalidate()`, so there is no second data contract to keep in
  sync.
- **Zero new notification infrastructure.** `NotificationProvider`/
  `NotificationCenter` already existed in `packages/ui` and were already
  mounted via `AppShell` → `AppProviders` → `admin_system`'s
  `Root.component.tsx` — the fix is one hook consuming an
  already-wired-up system, not new provider plumbing. (Reuse Before You
  Build, verified by reading the actual provider tree before writing
  anything.)

The notify callback follows the same ref pattern the hook already used
for `revalidator.revalidate` — kept current via a small effect, read via
`notifyRef.current` inside socket listeners — so the socket effect's
dependency array stays `[runId]` and reconnect/resubscribe never churns
on identity changes.

## Consequences

- Registering or editing a project to point at a monorepo subfolder
  (`packages/ui`, one app of many) now genuinely works — the subfolder
  is its own project, distinct from a root-level registration of the
  same repo. This is the intended granularity for scanning one package
  of a monorepo.
- The ad hoc CLI path's behavior is unchanged: running a skill from deep
  inside a repo still attaches to the repo-root project.
- Any run-detail page open during a scan now tells the user out loud
  when a scan fails or finishes, instead of relying on them noticing a
  table cell change.
- `resolveLocalPath` intentionally does **not** validate that the path
  is a directory vs. a file, or apply any containment policy —
  `assertSafeTargetPath` (agent-runner, ADR-011) remains the
  execution-time gate, and ADR-014 already records directory browsing as
  deliberately unscoped for this internal tool.

## Verification performed

All real, no mocks of the DB or the running system:

- **Bug 1 regression tests** — `registerProject.util.test.ts` /
  `updateProject.util.test.ts` each gained a test that `git init`s a real
  tmpdir, creates a nested `packages/some-package` folder, registers /
  re-paths to the subfolder, and asserts the row's `local_path` is the
  subfolder and explicitly `not.toBe(repoRoot)` — the exact pre-fix
  failure mode. Full `scan-ingestion` suite green against the live
  `cqms_db`.
- **The user's actual broken row was corrected through the real edit
  endpoint** (HTTP POST to `/cqms/projects/edit/:projectId`), not raw
  SQL, and confirmed via direct `psql` query afterward.
- **Bug 2 tests** — 5 new `useRunStatusSocket.hook.test.tsx` cases
  (jsdom, hand-rolled `FakeWebSocket` stub, rendered inside the real
  `NotificationProvider` + `createRoutesStub`): subscribe-on-open,
  error toast on `failed`, success toast on `succeeded`, no toast on
  `scan-progress`, malformed JSON ignored without throwing.
- **Live end-to-end**: with the orchestrator running, a real
  `code-smell-zen` scan was triggered against the corrected
  `packages/ui` path and genuinely succeeded — also re-confirming
  `assertSafeTargetPath` allows a legitimate subfolder of the CQMS repo
  while still rejecting the repo root itself (the pre-fix run's 3
  failures were exactly that rejection working as designed). The
  verification run was deleted afterward; the user's own historical runs
  were left untouched.
