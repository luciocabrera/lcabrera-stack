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

1. **Check for collisions.** Skim [`BOARD.md`](./BOARD.md), or run
   `vp run coordination:verify` — it warns when an area you're about to claim
   overlaps an existing active task. If it does, coordinate with that owner or
   narrow your scope before proceeding.
2. **Claim it.** Copy [`tasks/_TEMPLATE.md`](./tasks/_TEMPLATE.md) to
   `tasks/<id>.md`, fill in the frontmatter — crucially the `area` globs, which
   are the soft lock others read — then `vp run coordination:board` to add it to
   the board.
3. **Branch.** Never commit non-trivial work straight to `main`.
4. **Keep it current.** Bump `updated:` as you make progress; move `status:`
   through `active → review` (and `blocked`/`paused` when true). Stale tasks are
   flagged so abandoned work surfaces instead of rotting like the old plan files.
5. **Close it.** When the work merges, **delete the task file** (its history lives
   in the PR and commits) and regenerate the board. Open a PR early — a draft PR
   is the human-visible progress surface that pairs with this register.

That's it. The ceremony is one file and two commands; the payoff is that no one
collides blind.

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
---
```

Keep `area` **as narrow as the work really is** — a wide glob blocks more than it
should. `packages/ui/src/components/Table/TableBody/**` is a better claim than
`packages/**` if you're only in `TableBody`. And prefer a concrete prefix over a
mid-glob `**`: `packages/ui/src/**/Table/**` matches a `Table` segment at _any_
depth (even `.../Modal/Table/...`), so it over-triggers the overlap warning —
`packages/ui/src/components/Table/**` says what you mean.

---

## The check — `coordination:verify`

`vp run coordination:verify` (CI step in `check-safe.yml`; script:
[`scripts/verify-coordination.mjs`](../../scripts/verify-coordination.mjs)) keeps
the register honest, the way `commands:verify` keeps COMMANDS.md honest. It
distinguishes **errors** (fail the build) from **warnings** (surfaced, never
blocking — a warning must not fail an unrelated PR because someone else's task
drifted):

| Check          | Level | Fails when…                                                                |
| -------------- | ----- | -------------------------------------------------------------------------- |
| **schema**     | error | a task file is missing a field, has a bad status/owner, or a mismatched id |
| **unique-id**  | error | two task files share an id                                                 |
| **board-sync** | error | `BOARD.md` doesn't match the task files (compared as data, not text)       |
| **overlap**    | warn  | two non-done tasks declare intersecting `area` globs                       |
| **stale**      | warn  | a non-done task's `updated:` is older than 14 days                         |
| **branch**     | warn  | a task's branch resolves to no local/origin ref (best effort)              |

`BOARD.md` is **generated** — `vp run coordination:board` rewrites it from the
task files. Never hand-edit it; edit the task file and regenerate. board-sync
compares the _parsed row data_, so Oxfmt reflowing the table is invisible while a
genuinely missing or mislabelled row still fails.

An overlap warning looks like:

```
Coordination register — 1 warning(s):

  ⚠ table-ui-fixes.md and table-refresh.md claim overlapping areas
    (e.g. `packages/ui/src/components/Table/**`) — narrow a glob or serialise the work.
```

---

## Relationship to the other surfaces

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
