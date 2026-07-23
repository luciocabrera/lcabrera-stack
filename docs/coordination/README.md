# Coordination — who is working on what

Multiple agents (Claude, Copilot, Gemini) and humans work this repo in parallel.
This directory is the **canonical, in-git register of work in flight** — the one
place that answers _who is working on what, on which branch, in which files, and
what state is it in_.

It exists because that answer used to live nowhere shared. The only signals were
`git branch -vv` (a name and a commit — no owner, status, or files) and per-agent
scratch in `~/.claude/plans/` (opaque names like `task-four-independent-vast-galaxy.md`,
invisible to every other agent and to you). That gap let one agent nearly edit
the column-resize code another agent already owned — nothing in the repo could
have warned it. Putting the claim in git fixes that.

> **The governing rule, same as [`docs/README.md`](../README.md):** coordination-
> relevant truth lives in git, visible to all agents and humans. Out-of-git stores
> (`~/.claude/plans/`, agent auto-memory) are private scratch — fine for thinking,
> never the shared record.

---

## The protocol (claim before you touch)

Before starting **non-trivial** work (anything beyond a one-file fix you'll commit
immediately):

1. **Check for collisions.** Run `vp run coordination:verify` — it warns when an
   area you're about to claim overlaps an existing active task. (For a table view
   of the register, `vp run coordination:board` writes a local, gitignored
   `BOARD.md`; it is never committed — see [ADR-037](../cqms/decisions/ADR-037-coordination-board-is-a-local-view.md).)
   If there's an overlap, coordinate with that owner or narrow your scope first.
2. **Claim it.** Copy [`tasks/_TEMPLATE.md`](./tasks/_TEMPLATE.md) to
   `tasks/<id>.md`, fill in the frontmatter — crucially the `area` globs, which
   are the soft lock others read. That file **is** the claim; there is no board
   to regenerate or commit.
3. **Pick a branch strategy** — an independent branch (the default) or join a
   shared one. See [Independent vs shared branches](#independent-vs-shared-branches)
   below. Never commit non-trivial work straight to `main`.
4. **Keep it current.** Bump `updated:` as you make progress; move `status:`
   through `active → review` (and `blocked`/`paused` when true). Stale tasks are
   flagged so abandoned work surfaces instead of rotting like the old plan files.
   If the task tracks a backlog issue (`issue:`), **self-assign that issue the
   moment you start** (`gh issue edit <n> --add-assignee @me`) — that's the signal
   that moves its Planning-board card to In Progress before any PR exists (the rest
   of the Status column is automated; see
   [github-planning.md → Status automation](../tooling/github-planning.md#status-automation)).
5. **Close it.** When the work merges, **delete the task file** (its history lives
   in the PR and commits). Open a PR early — a draft PR is the human-visible
   progress surface that pairs with this register.

That's it. The ceremony is one file; the payoff is that no one collides blind.

**Shortcut (the recommended path):**
`vp run coordination:claim -- <id> "<title>" (--issue <n> | --new-issue) [--area <glob> ...]`
does steps 2–5 in one command — it **creates (`--new-issue`) or links (`--issue <n>`)
the backlog issue and self-assigns it right away** (so its board card moves to In
Progress at the START, before any PR — closing the window where another agent
picks up the same issue), writes the required `issue:` field, scaffolds the task,
branches off `main`, commits, and opens a draft PR so the claim is visible
immediately (via `coordination:board:live`). Add `--worktree` to work in an
isolated worktree (recommended when other agents are active), or `--dry-run` to
preview every action first. Exactly one of `--issue` / `--new-issue` is required.

---

## The task file

One file per active task, `tasks/<id>.md`, YAML frontmatter + freeform notes:

```yaml
---
id: table-ui-fixes # kebab-case, MUST equal the filename slug
title: Four independent fixes in packages/ui Table
owner: agent:claude # agent:<name> | human:<name>
status: active # active | blocked | review | paused | done
branch: fix/table-column-resize # the branch, or (uncommitted) / (worktree)
area: # globs this work OWNS — the soft lock; keep them narrow
  - packages/ui/src/components/Table/**
started: 2026-07-18
updated: 2026-07-18
plan: task-four-independent-vast-galaxy.md # optional out-of-git scratch pointer
pr: (none) # PR number/URL once opened
issue: #50 # REQUIRED — the GitHub backlog issue this picks up; coordination:verify rejects a live task without a real reference (ADR-036)
---
```

Keep `area` **as narrow as the work really is** — a wide glob blocks more than it
should. `packages/ui/src/components/Table/TableBody/**` is a better claim than
`packages/**` if you're only in `TableBody`. And prefer a concrete prefix over a
mid-glob `**`: `packages/ui/src/**/Table/**` matches a `Table` segment at _any_
depth (even `.../Modal/Table/...`), so it over-triggers the overlap warning —
`packages/ui/src/components/Table/**` says what you mean.

---

## Independent vs shared branches

Two agents don't always want isolation. Sometimes they're building one thing in
parallel slices and **each needs the other's in-progress changes** — isolating
them onto separate branches would mean constant cross-merging. So the register
supports both modes, and makes the choice explicit.

**Independent branch — the default.** Your work is separable and can merge on its
own. Put a unique `branch:` on your task and go. Nothing else to do; another agent
whose `area` overlaps yours gets an overlap warning and coordinates.

**Shared branch — when changes are mutually dependent.** Multiple agents commit to
**one** branch. Declare it with a descriptor, [`branches/<slug>.md`](./branches/_TEMPLATE.md)
(copy the template), naming its `base`, merge `target`, and one **`integrator`** —
the single owner who rebases the branch onto `base` and does the final merge, so
rebases don't race. Each agent still keeps their own task file with a **narrow,
non-overlapping `area`**, all pointing at that `branch:`. The check is branch-aware:

- Overlapping areas on **different** branches → a collision warning (coordinate).
- Overlapping areas on the **same shared** branch → **no warning** — that's the
  collaboration you asked for; the within-branch protocol below governs it instead.
- 2+ active tasks on one branch with **no descriptor** → a warning to declare it
  shared or split. (Sharing a branch silently is the thing to avoid.)

**Within a shared branch:** each agent works their own `area`; coordinate before
touching a file outside it. **Pull/rebase before every push, and push small and
often** — a shared branch only works if everyone stays near its head. The
integrator owns the rebase onto `base` and the merge to `target`. Delete the
descriptor when the branch merges.

Deciding: reach for a shared branch only when the mutual dependency is real
(you'd otherwise cross-merge constantly). It costs rebase discipline and risks
conflicts; an independent branch that merges cleanly on its own is simpler when
the work genuinely separates.

---

## Keeping the register current across branches

The register only works if agents can _see_ each other's claims. Two rules make
that hold when several agents work at once.

**1. One working tree per agent — never a shared directory.** A git working tree
has _one_ checked-out branch and _one_ index; two agents in the same folder means
their uncommitted files, staged changes, and branch switches clobber each other
(one agent's `git checkout` silently reverts the other's edits). Isolate with a
worktree — `git worktree add ../vrc-<task> -b <branch>` — or a separate clone.
"Different branches" only helps if they're in _different working trees_.

A hand-made worktree needs its **own** `vp install`. Symlinking the primary
checkout's `node_modules` looks like a shortcut and is a trap: the pnpm workspace
links inside it still point at the primary checkout's packages, so `@repo/*`
resolves _there_ while you edit here. Tooling then reads code you did not change
— and picks up another agent's uncommitted work, the exact cross-contamination
the worktree was for. It fails silently, and only for changes that touch a
workspace package. `coordination:claim --worktree` installs for you (and
generates the route types, which are not committed); anything DB-touching also
needs the gitignored local env files copied across. A **live prod-build check is
the case that bites**: `vp run start` for an SSR app loads `docker/local/.env`
via `../../docker/local/.env` from the app dir, so a worktree missing that file
silently skips the env load and fails as though the DB env were unset — which
reads as a bug in the code under test rather than a missing fixture. Symlink or
copy the primary checkout's `docker/local/.env` into the worktree before such a
run.

**2. The claim lives on `main`, landed early — not on your feature branch.** A
task file is a shared lock only once it's on `main`, where every other agent
branching off `main` sees it. So commit `tasks/<id>.md` to `main` **first** — a
tiny claim-only PR, before the real work — separate from the work branch. If
claims sit only on feature branches, no one sees them until merge and the register
fragments.

**`BOARD.md` never conflicts, by construction.** It is a **gitignored, local-only
view** ([ADR-037](../cqms/decisions/ADR-037-coordination-board-is-a-local-view.md)):
`vp run coordination:board` rebuilds it from the task files whenever you want to
read the register as a table, but it is never committed. Because no PR ever
contains `BOARD.md`, two concurrent claims/closes can never collide on it — the
recurring conflict that a committed generated board caused (and that a git
merge-driver could not fix, since GitHub's server-side merge never runs one) is
gone. Claims and closes touch only `tasks/<id>.md`, which are distinct files.

**Where progress lives:** the task files answer _who owns what area, on which
branch_ (the `area` soft lock); GitHub Issues + the Planning board answer _status_.
**Live progress lives in the draft PR** — its commits, checks, and status. For a
terminal view that joins the claims with real PR state (draft, checks, and any open
PR with _no_ task), run `vp run coordination:board:live` (needs `gh`; it prints,
never writes a file). Open the PR early; that is the human-visible progress surface.

**Close on merge.** When your PR merges (with `--delete-branch`), delete the task
file. If a PR can't delete the task that tracks itself, do it in a tiny follow-up.
A merged task left `active` is drift — `coordination:verify` nudges on the
tell-tales (a branch that no longer resolves; a task active for days with no
branch or PR recorded).

---

## The check — `coordination:verify`

`vp run coordination:verify` (CI step in `check-safe.yml`; script:
[`scripts/verify-coordination.mjs`](../../scripts/verify-coordination.mjs)) keeps
the register honest, the way `commands:verify` keeps COMMANDS.md honest. It
distinguishes **errors** (fail the build) from **warnings** (surfaced, never
blocking — a warning must not fail an unrelated PR because someone else's task
drifted):

| Check             | Level | Fails when…                                                                                                                                                                      |
| ----------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **schema**        | error | a task or branch file is missing a field, has a bad status/owner, or a mismatched id                                                                                             |
| **unique-id**     | error | two task files share an id                                                                                                                                                       |
| **overlap**       | warn  | two non-done tasks on **different** branches declare intersecting `area` globs — including claims read from live remote branches, and a warning for any branch it could not read |
| **shared-branch** | warn  | 2+ active tasks share a branch with no descriptor, or a descriptor has no tasks                                                                                                  |
| **stale**         | warn  | a non-done task's `updated:` is older than 14 days                                                                                                                               |
| **branch**        | warn  | a task's branch resolves to no local/origin ref (best effort)                                                                                                                    |

There is no board-drift check: `BOARD.md` is a gitignored local view, never
committed, so there is nothing to keep in sync ([ADR-037](../cqms/decisions/ADR-037-coordination-board-is-a-local-view.md)).
`vp run coordination:board` rewrites the local view from the task + branch files
whenever you want to read the register as a table.

An overlap warning looks like:

```
Coordination register — 1 warning(s):

  ⚠ table-ui-fixes.md and table-refresh.md (branch table-refresh) claim
    overlapping areas (e.g. `packages/ui/src/components/Table/**`) on
    different branches — narrow a glob, serialise, or share one branch
    (branches/<slug>.md).
```

### Overlap detection sees other branches

The check reads claims from **every live branch on `origin`**, not just the
files in your working tree. That matters because `coordination:claim` commits
the task file onto the branch it creates, so a claim is off-`main` from the
moment it exists: a tree-only check compared each agent's claim against nothing
and reported a clean register to both sides of a real collision (#233).

Two consequences worth knowing:

- A claim is named by the branch it **declares**, not the branch it was found
  on — every branch cut from `main` inherits a copy of whatever task files were
  live then, so "found on" is often some unrelated branch. For the same reason,
  a claim whose declared branch no longer exists on `origin` is treated as
  finished and ignored — branches are deleted when their PR merges, but the
  inherited copies of the task file outlive them.
- The live branch list comes from the remote, not from your local
  `origin/*` refs, which go stale silently (this checkout once held 109 refs
  against 4 real branches). If a live branch has no local ref, or your ref is
  behind it, that branch is **reported as unread** rather than skipped —
  `git fetch --prune` clears it. Being unable to look is never presented as
  having looked and found nothing.

`--no-remote` skips the remote read for a fast or offline loop, and says so in
the output.

---

## Relationship to the other surfaces

- **GitHub Issues / sub-issues / Milestones / Projects** — the **durable backlog**
  (_what should happen, eventually, and why_), the complement to this register's
  _in-flight_ view (_who is touching what, right now_). Adopted in
  [ADR-036](../cqms/decisions/ADR-036-github-planning-layer.md); runbook in
  [`docs/tooling/github-planning.md`](../tooling/github-planning.md). The two link
  one-way: a task that picks up a backlog item points to it with its optional
  `issue:` field, and PRs close issues (`Closes #N`). The register is **not** moved
  to Issues — Issues need `gh` + auth + network and are invisible to fork/headless
  agents, whereas a task file is read offline on any branch and gated by
  `coordination:verify`. There is deliberately **no** bidirectional file↔Project
  sync: status lives in the Issue, the `area` soft lock lives in the task file, and
  neither is a generated file that two branches can conflict on (ADR-037).
- **`~/.claude/plans/<name>.md`** — one agent's private scratch for one task. Fine
  for thinking; **not** the shared record. When a plan describes work others need
  to see, its _claim_ graduates here (a task file) and its _decisions_ graduate to
  an ADR / STATUS entry. Historical plans are catalogued in
  [`PLAN_TRIAGE.md`](./PLAN_TRIAGE.md).
- **Agent auto-memory** — one agent's cross-session notes, also invisible to
  others. Same rule: anything shared belongs in the repo.
- **[`docs/README.md`](../README.md)** — the map of where every _durable_ fact
  lives. This register is the map of _in-flight_ work; when work lands, its durable
  residue (an ADR, a STATUS update, code) is what remains.
