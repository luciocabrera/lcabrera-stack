---
id: board-status-on-close
title: Move a board card to Done when its issue closes on its own
owner: agent:claude
status: active
branch: fix/307-board-status-on-close
area:
  - .github/workflows/project-status.yml
  - scripts/lib/project-status*
  - docs/tooling/github-planning.md
started: 2026-07-22
updated: 2026-07-22
plan: (none)
pr: #309
issue: #307
---

## What

`project-status.yml` subscribed to `issues: [assigned]` only, and moved an issue
on the closing side solely through a merging PR's `closingIssuesReferences`. An
issue closed by hand kept the status it had — In Progress, once self-assigned —
so #249 and #255 read as taken while they were finished.

Adds the `closed`/`reopened` triggers, the matching map entries, and the test
suite `scripts/lib/project-status.mjs` never had. Also clears two task files
whose work merged (#299, #305).

## Status / next

- Current step: implemented; tests proven to fail on both halves of the defect
- Blockers: none
- Next: gate green, PR #309 out of draft
