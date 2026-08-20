---
id: 799-devkit-scaffolding-seeds
title: Ship the workflow, hook and template scaffolding as devkit seeds
owner: agent:claude
status: review
branch: chore/799-799-devkit-scaffolding-seeds
area:
  - packages/devkit/**
  - packages/repo-standards/scripts/adr-registry*
  - scripts/verify-devkit-seeds.mjs
  - scripts/lib/devkit-seeds*
  - COMMANDS.md
started: 2026-08-20
updated: 2026-08-20
plan: (none)
pr: #859
issue: #799
---

## What

`@lcabrera/devkit` ships the scaffolding a consumer needs to actually run the
gates: five workflow seeds, two git hooks, the pull-request and issue templates,
the coordination register, the decision home and a `COMMANDS.md`. They land under
a new `full` profile; `agent` is unchanged.

Two supporting changes came out of doing it. `renderIndex` in the gate runtime
wrote a CQMS sentence, this repository's task names and links to two of its own
decision records into every index it generates — so a seeded decision home could
never pass its own gate. And a new repository gate, `seeds:verify`, derives the
words a shipped file may not contain from this repository rather than listing
them.

## Status / next

- Current step: PR #859 open for review; local gate green.
- Blockers: none.
- Next: address review and CI findings, then merge.
