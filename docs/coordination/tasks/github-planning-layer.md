---
id: github-planning-layer
title: Adopt GitHub Issues/Projects as the durable planning layer (ADR-036)
owner: agent:claude
status: review
branch: worktree-github-planning-layer
area:
  - .github/workflows/add-to-project.yml
  - docs/cqms/decisions/ADR-036-github-planning-layer.md
  - docs/tooling/github-planning.md
  - docs/coordination/README.md
  - docs/coordination/tasks/_TEMPLATE.md
started: 2026-07-19
updated: 2026-07-19
plan: (none)
pr: '#57'
issue: (none)
---

## What

Add the durable-backlog layer on top of the in-git coordination register:
ADR-036 (the boundary), an optional `issue:` task pointer, the inert
`add-to-project` workflow, and the `docs/tooling/github-planning.md` runbook.
Seeds the live backlog: milestone _Coverage rollout — Phase 3_, epic #50 with
sub-issues #51–#55, and setup issue #56.

## Status / next

- Current step: PR up for review.
- Blockers: none (Project board activation is a one-time owner step, tracked in #56).
- Next: land; owner grants `project` scope + sets `PROJECT_URL`/`ADD_TO_PROJECT_PAT` to light the board.
