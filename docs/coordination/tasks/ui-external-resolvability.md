---
id: ui-external-resolvability
title: Make @repo/ui resolvable outside this repo: package.json export, drop the @/ alias, freeze stylex paths
owner: agent:claude
status: review
branch: ui-external-resolvability
area:
  - packages/ui/**
  - packages/ts-configs/**
  - .claude/rules/typescript.md
started: 2026-07-21
updated: 2026-07-21
plan: (none)
pr: #232
issue: #231
---

## What

Three defects found by the StyleX distribution spike, all of which break a
published `@repo/ui` while being invisible inside this monorepo:

- the missing `"./package.json"` export that makes StyleX's package discovery
  fail silently in a consumer's build
- `@/` imports, which resolve only through a tsconfig
- unguarded `*.stylex.ts` paths, which are the identity of the theme variables

## Status / next

- Current step: done, PR #232 open for review
- Blockers: none
- Next: close when merged. The remaining publishing work is the scope rename
  (blocked on the npm scope name) and the build for api/server/utils —
  `@repo/ui` ships source and needs no build.
