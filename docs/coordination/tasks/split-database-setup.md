---
id: split-database-setup
title: Split the database setup between the showcase and the API repo
owner: agent:claude
status: review
branch: chore/689-split-database-setup
area:
  - docker/local/**
  - scripts/seed-db.cjs
  - scripts/ARCHITECTURE.md
  - apps/react-router/db/**
  - apps/react-router/scripts/seed-db.mjs
  - apps/react-router/package.json
  - apps/react-router/README.md
  - apps/api-server/db/**
  - apps/api-server/scripts/**
  - apps/api-server/package.json
  - apps/api-server/ARCHITECTURE.md
  - apps/api-server-fast/package.json
  - apps/api-server-fast/ARCHITECTURE.md
  - .sonarcloud.properties
started: 2026-08-14
updated: 2026-08-14
plan: (none)
pr: https://github.com/luciocabrera/vite-react-compiler/pull/709
issue: #689
---

## What

Split the database setup between the showcase and the API repo: each side owns
the DDL for the tables it serves and can seed with nothing else present.

## Status / next

- Current step: implemented and gated; PR open for review
- Blockers: none
- Next: #691 carries `apps/api-server/db/` + `apps/api-server/scripts/` with the
  workspace; #693 sweeps whatever is left behind

## Notes

- Touches `COMMANDS.md` (Database section + the `apps/react-router` row of the
  per-workspace table) and `AGENTS.md` (Local Database Workflow only) — both
  outside the `area` globs above, both contended this wave.
