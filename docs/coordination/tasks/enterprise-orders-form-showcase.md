---
id: enterprise-orders-form-showcase
title: Secured enterprise-orders Form showcase (create/view/edit + auth)
owner: agent:claude
status: active
branch: (uncommitted)
area:
  - packages/ui/src/components/Form/**
  - packages/ui/src/components/Modal/**
  - packages/ui/src/components/RadioOptionGroup/**
  - packages/ui/src/design-system/**
  - packages/data-access/src/db/**
  - apps/react-router/src/routes/enterprise-orders/**
  - apps/react-router/src/routes/login/**
  - apps/react-router/src/routes/logout/**
  - apps/react-router/src/routes/api/enterprise-orders-delete/**
  - apps/react-router/src/auth/**
started: 2026-07-19
updated: 2026-07-19
plan: ~/.claude/plans/let-s-create-a-detailed-golden-map.md
pr: (none)
issue: '#79'
---

## What

Make `/enterprise-orders` the flagship `@repo/ui` Form showcase: real create/view/edit
routes rendered as **modals over the list** (ChoiceModal pattern), full ~60-field layout
(tabs → card groups → span rows), **client-first validation** via `clientAction`, a
**generic** CRUD data layer in `@repo/data-access`, and **secured routes** (login built
with the Form + RR7 middleware guard + redirect/return-to). Epic **#79** (sub-issues
#80–#94). Full plan in `plan:`.

## Status / next

- Current step: orchestration set up — epic + 15 sub-issues created; this claim landing on `main`.
- Blockers: none.
- Next: start **Track 1 (`@repo/ui`, #80–#85)** and **Track 2 (`@repo/data-access`, #86)** on
  independent branches (mergeable on their own); Tracks 3 (#87–#91) & 4 (#92–#94) follow on a
  shared integration branch `feat/enterprise-orders-showcase` with an integrator once 1/2 land.

## Branch strategy

- **Track 1 (`pkg: ui`)** and **Track 2 (`pkg: data-access`)** → independent branches, small
  PRs to `main` (`feat/ui-form-*`, `feat/data-access-write-builders`).
- **Track 3 (enterprise-orders CRUD)** and **Track 4 (auth)** → shared branch
  `feat/enterprise-orders-showcase` + a `branches/` descriptor + an integrator, once 1/2 are in.
- As each track starts, its owner adds a narrower task file (real branch, non-overlapping `area`).
