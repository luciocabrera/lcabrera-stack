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

Sweep the comments ADR-095 moves out of every workspace, and name the third
position the convention had never stated — a note between a type's members.

A lint rule for it was built here and removed before merge: ADR-104 records why
the convention is held by review instead. The sweep is repo-wide, so the `area`
above is wide on purpose. Coordinate before starting anything that edits source
in those workspaces.

## Status / next

- Current step: sweep applied, lint rule removed, gate green
- Blockers: none
- Next: hold for the verifier
