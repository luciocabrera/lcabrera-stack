---
id: retire-in-repo-backlog
title: Retire the in-repo planning backlog now the issues exist
owner: agent:claude
status: review
branch: docs/417-retire-in-repo-backlog
area:
  - docs/agents/planning/**
started: 2026-07-25
updated: 2026-07-25
plan: (none)
pr: '#418'
issue: #417
---

## What

The backlog document under `docs/agents/planning/` held 24 issues and 5 epics as a
692-line file. They now exist on GitHub (#389–#412), so it was a second backlog
beside the one ADR-036 makes canonical — and it would drift from the issues it
created.

- Delete it. `planning-summary.md` keeps the session's reasoning and carries the
  plan-id → issue-number map, which is the part GitHub does not hold.
- `plan:issues` now requires `--plan <file>`. A tracked default meant a standing
  "the backlog" file in git, which is the thing ADR-036 rules out.
- The provenance line on a filed issue names the document actually read, instead
  of a hardcoded path that would cite a retired file forever.

## Status / next

- Current step: gate green, PR #418 out of draft.
- Blockers: none.
- Next: delete this file when #418 merges.
