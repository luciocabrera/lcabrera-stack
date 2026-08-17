---
id: delete-api-workspaces
title: Delete the API workspaces and references
owner: agent:claude
status: review
branch: chore/693-delete-api-workspaces
area:
  - apps/api-server/**
  - apps/api-server-fast/**
  - apps/shared/**
started: 2026-08-17
updated: 2026-08-17
plan: (none)
pr: 743
issue: #693
---

## What

Remove the three car-sales API workspaces and every reference left behind, now
that they live in `luciocabrera/api-playground`.

## Status / next

- Current step: PR open, full gate green
- Blockers: **do not merge until `api-playground` is verified green.** It cannot
  install until vite-react-compiler#742 publishes the packages it depends on.
- Next:
  - Merge #742, confirm the publish.
  - Verify `api-playground` installs, builds and tests against registry versions.
  - Only then merge this.
