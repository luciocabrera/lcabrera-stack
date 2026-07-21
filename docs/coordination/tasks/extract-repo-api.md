---
id: extract-repo-api
title: refactor(packages): extract @repo/api and cut the ui to pg dependency
owner: agent:claude
status: active
branch: refactor/extract-repo-api
area:
  - packages/api/**
  - packages/data-access/src/api/**
  - packages/ui/scripts/check-public-api-client-safe.mjs
  - packages/ui/src/utils/filters/**
  - apps/react-router/src/services/**
  - apps/react-router/src/routes/api/filter-options/**
started: 2026-07-21
updated: 2026-07-21
plan: (none)
pr: (none)
issue: #144
---

## What

`@repo/ui` transitively depended on `pg` through `@repo/data-access`, for two
fetch helpers. Extract the browser half into a new `@repo/api` package and
repoint every consumer, so the UI library no longer drags a Postgres driver
into consumers' dependency graphs.

Also extends `packages/ui`'s `check:public-api`, which could not see the leak:
it followed only relative paths, so it never crossed a package boundary.

## Status / next

- Current step: gate + PR
- Blockers: none
- Next: #146 (data-access to @repo/db)
