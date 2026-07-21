---
id: npm-scope-rename
title: Rename the four public packages from @repo/* to @lcabrera/*
owner: agent:claude
status: review
branch: npm-scope-rename
area:
  - packages/**
  - apps/**
  - docs/**
  - AGENTS.md
started: 2026-07-21
updated: 2026-07-21
plan: (none)
pr: #240
issue: #239
---

## What

`@repo` is the `create-turbo` placeholder — nobody owns it, so nothing could ever
be published under it. The four publishable packages move to the `@lcabrera` npm
org; the six internal ones keep `@repo/*`, so the specifier says which side of the
product boundary a package is on. Recorded as ADR-040.

Had to land before the first release: renaming a package renames every StyleX
custom property it defines, which is free now and a silent break for consumers
after `v0.1.0`.

## Status / next

- Current step: done, PR #240 open for review
- Blockers: none
- Next: close when merged. Then the build pipeline (`dist` + `.d.ts` for
  api/server/utils only — ui ships source), then Changesets + `v0.1.0`.
