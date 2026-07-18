---
id: my-task-slug
title: One line, human-readable — what this work is
owner: agent:claude
status: active
branch: (uncommitted)
area:
  - packages/ui/src/components/SomeArea/**
started: 2026-07-18
updated: 2026-07-18
plan: (none)
pr: (none)
---

<!--
Copy this file to `<id>.md` (id must equal the filename slug) and fill it in.
Then run `vp run coordination:board` to add it to BOARD.md, and
`vp run coordination:verify` to confirm the register is consistent.

Fields:
  id       kebab-case, must equal the filename (e.g. table-ui-fixes.md → table-ui-fixes)
  owner    agent:<name> (claude, copilot, gemini, …) or human:<name>
  status   active | blocked | review | paused | done
  branch   the git branch, or (uncommitted) if not yet committed, or (worktree)
  area     one or more globs this work OWNS — the soft lock other agents read
           before touching. Keep them as NARROW as the work really is; a wide
           glob blocks more than it should. Prefer a concrete path prefix
           (`packages/ui/src/components/Table/**`) over a mid-glob `**`
           (`packages/ui/src/**/Table/**`) — the latter matches `Table` at ANY
           depth and over-triggers the overlap warning. `coordination:verify`
           warns when two non-done tasks' areas intersect.
  started  YYYY-MM-DD
  updated  YYYY-MM-DD — bump this whenever you make progress; stale tasks are flagged
  plan     optional pointer to out-of-git scratch (~/.claude/plans/<name>.md) or a *_PLAN.md
  pr       PR number/URL once opened

Delete this file when the work merges (its history lives in the PR/commits).
-->

## What

Short description of the work.

## Status / next

- Current step:
- Blockers:
- Next:
