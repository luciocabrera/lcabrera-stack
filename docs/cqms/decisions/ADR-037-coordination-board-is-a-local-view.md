# ADR-037: The coordination `BOARD.md` is a gitignored local view, not a committed artifact

**Status:** Accepted
**Amends:** [ADR-036](./ADR-036-github-planning-layer.md) (the register's `board-sync` drift check is retired) and the coordination register (`docs/coordination/`, `verify-coordination.mjs`).

## Context

The in-git coordination register (ADR-036) had three parts: task files whose
`area` globs are a soft lock, a **committed, generated `BOARD.md`**, and
`coordination:verify` — whose `board-sync` check failed the build if `BOARD.md`
did not match the task files.

The committed board was a recurring source of merge conflicts. `BOARD.md` is
regenerated from the task files, so **every** coordination PR (a claim, a
status bump, a close-out) rewrote it. With multiple agents working in parallel —
the exact scenario the register exists for — two PRs in flight at once each
regenerated the single `BOARD.md` and collided on merge. This happened
repeatedly, and worse:

- **A git merge-driver cannot fix it.** GitHub's server-side / UI merge does
  **not** run custom merge drivers, so the conflict still surfaces there — which
  is exactly where it bit us, and where a human hand-resolving a _generated_ file
  picked stale rows, producing both a format-gate failure and register drift.
- **`vp fmt --check .` runs repo-wide on every PR**, so a committed `BOARD.md`
  must always be Oxfmt-clean. Regenerating it via a post-merge bot (the
  `CHANGELOG.md` pattern) would need either a heavy `vp install` in the workflow
  or an Oxfmt-exact generator — real cost and fragility for a file that is pure
  derived data.

The board is a **view**. Its data — who owns which `area`, on which branch — lives
in the task files, which are the actual soft lock and which two agents never
conflict on (each claim is a distinct `tasks/<id>.md`). Nothing needs the rendered
table to be in git.

## Decision

**`docs/coordination/BOARD.md` is gitignored and never committed.** It becomes a
local-only view that `vp run coordination:board` writes on demand for anyone who
wants to read the register as a table.

- The `board-sync` ERROR check is **removed** from `coordination:verify`; there is
  no committed board to keep in sync. Schema, unique-id, overlap, shared-branch,
  stale, and branch checks are unchanged — the `area`-overlap warning remains the
  real collision guard, and it reads the task files directly.
- Claims and closes touch **only** `tasks/<id>.md` (and `branches/<slug>.md`).
  `coordination:claim` no longer regenerates or commits the board.
- **GitHub-visible status** is the linked Issue (open/closed) + the Planning board
  (Projects) — the layer ADR-036 already stood up. The register keeps the one
  thing Issues cannot express: the offline, CI-gated `area` soft lock.

## Consequences

- **Board conflicts become structurally impossible** — no PR ever contains
  `BOARD.md`, so there is nothing to collide on, hand-merge wrong, or drift.
- **No new machinery** — no bot, no workflow, no merge-driver, no Oxfmt coupling.
  The change is a `.gitignore` entry, `git rm --cached`, and the deletion of one
  verify check plus its now-dead `parseBoard`/`boardTuple` helpers.
- **The committed markdown table is gone from GitHub.** Mitigation: the task files
  are still committed and offline-readable (the source of truth), the Planning
  board is the GitHub-visible status view, and `vp run coordination:board` renders
  the table locally in one command.
- **Reject-and-revisit:** if a committed board is ever genuinely wanted back, the
  fallback is the `CHANGELOG.md` bot pattern (regenerate on `main` post-merge,
  `[skip ci]`), with `BOARD.md` added to the Oxfmt ignore list so it need not be
  formatter-clean. Not adopted now — it is strictly more machinery than the view
  approach for a derived file.
