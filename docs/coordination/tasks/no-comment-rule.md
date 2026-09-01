---
id: no-comment-rule
title: Enforce the no-comment rule, then sweep the code that predates it
owner: agent:claude
status: active
branch: chore/1028-no-comment-rule
area:
  - packages/eslint-local-rules/**
  - packages/vite-configs/src/**
  - packages/ui/src/**
  - packages/server/src/**
  - packages/api/src/**
  - packages/utils/src/**
  - packages/node-runtime/src/**
  - packages/tsconfig/src/**
  - packages/ts-configs/**
  - packages/repo-standards/scripts/**
  - apps/showcase/src/**
  - scripts/**
  - docs/agents/planning/table-row-grouping-plan.md
started: 2026-08-31
updated: 2026-09-01
plan: (none)
pr: #1045
issue: #1028
---

## What

Enforce ADR-095 mechanically — `local-rules/no-explanatory-comments` in
`@lcabrera/eslint-plugin`, turned on by both shared flat configs — then sweep the
comments that predate it out of every workspace the eslint pass reaches.

The sweep is repo-wide, so the `area` above is wide on purpose. Coordinate before
starting anything that edits source in those workspaces.

## Status / next

- Current step: rule landed and wired; sweep applied, gate green
- Blockers: none
- Next: `gh pr edit` #1045, then hold for the verifier
