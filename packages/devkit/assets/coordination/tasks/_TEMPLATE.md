---
id: my-task-slug
title: One line, human-readable — what this work is
owner: agent:claude
status: active
branch: (uncommitted)
area:
  - src/some/area/**
started: 2026-01-01
updated: 2026-01-01
plan: (none)
pr: (none)
issue: (none)
---

<!--
Copy this file to `<id>.md`, where `<id>` equals the filename slug, and fill it
in. This file **is** the claim — run the register gate to confirm the register is
consistent.

Fields:
  id       kebab-case, must equal the filename (table-ui-fixes.md → table-ui-fixes)
  title    one line, for someone who has not read the issue
  owner    agent:<name> or human:<name>
  status   active | blocked | review | paused | done
  branch   the git branch, or (uncommitted) if not yet committed, or (worktree).
           To collaborate on ONE branch with other agents, point several tasks at
           the same branch and declare it in `../branches/<slug>.md`.
  area     one or more globs this work OWNS — the soft lock others read before
           touching anything. Keep them as NARROW as the work really is; a wide
           glob blocks more than it should. Prefer a concrete prefix
           (`src/components/Table/**`) over a glob that can match at any depth
           (`src/**/Table/**`), which over-triggers the overlap warning.
  started  YYYY-MM-DD
  updated  YYYY-MM-DD — bump this as you make progress; stale tasks are flagged
  plan     optional pointer to scratch notes, or (none)
  pr       pull-request number or URL once one is open
  issue    REQUIRED — the backlog item this work picks up (`#50` or an issue
           URL). The gate REJECTS a live task without a real reference, because a
           claim with nothing behind it is a lock nobody can evaluate.

Delete this file when the work merges; its history lives in the pull request.
-->

## What

Short description of the work.

## Status / next

- Current step:
- Blockers:
- Next:
