---
branch: feat/big-thing
base: main
target: main
integrator: agent:claude
status: active
updated: 2026-07-18
---

<!--
Create this ONLY for a SHARED branch — one that 2+ agents work on together
because they need each other's in-progress changes. Independent work needs no
descriptor; just a task file with its own branch.

Copy to `<branch-slug>.md`, where the slug is the branch with every non-word
character replaced by `-` (feat/big-thing → feat-big-thing.md). Then run
`vp run coordination:verify`. (`vp run coordination:board` renders a local,
gitignored table view; it is never committed — ADR-037.)

Fields:
  branch      the git branch these tasks share
  base        what it branches from (usually main)
  target      what it merges back into (usually main)
  integrator  the ONE owner (agent:<name>/human:<name>) responsible for rebasing
              this branch onto base and doing the final merge — so rebases don't
              race. Everyone else pushes their sub-area; the integrator reconciles.
  status      active | merging | done
  updated     YYYY-MM-DD

Participants are inferred: every `tasks/<id>.md` whose `branch:` equals this one.
Each participant still owns a NARROW, non-overlapping `area` in their task file,
so collaborators don't edit the same files blind.

Delete this descriptor when the branch merges.
-->

## What

Why this branch is shared — the mutual dependency that makes independent branches
the wrong tool here.

## Within-branch protocol

- Each participant owns a distinct `area` (see their task file). Coordinate before
  touching a file outside yours.
- **Pull/rebase before every push; push small and often.** A shared branch only
  works if everyone stays close to its head.
- The **integrator** owns rebasing onto `base` and the final merge to `target`.

## Sub-area map

- `agent:name` → `path/glob/**` — what
