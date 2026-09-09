---
id: devkit-emit-react-router-app
title: Emit a React Router app consuming the packages from npm
owner: agent:claude
status: review
branch: feat/1076-devkit-emit-react-router-app
area:
  - packages/devkit/README.md
  - packages/devkit/assets/workspace/apps/**
  - packages/devkit/assets/workspace/gitignore
  - packages/devkit/assets/workspace/pnpm-workspace.yaml
  - packages/devkit/assets/workspace/packages/typescript-config/tsconfig.entries.ts
  - packages/devkit/scripts/workspace-app.test.mjs
  - scripts/verify-devkit-tarball.mjs
  - scripts/lib/devkit-tarball.mjs
  - scripts/lib/devkit-tarball-consumer.test.mjs
started: 2026-09-09
updated: 2026-09-09
plan: (none)
pr: #1136
issue: #1076
---

## What

The `monorepo` rung places an application: React Router in framework mode, one
route rendering a table from static rows, through `@lcabrera/ui`,
`@lcabrera/api` and `@lcabrera/utils` declared as registry semver ranges.

The catalog gains the entries that application needs (`@testing-library/react`,
`jsdom`, the babel toolchain the shared plugins config composes); the tsconfig
roster gains its two entries; the packed-tarball gate gains a check that no
produced file carries a `workspace:` specifier.

## Status / next

- Current step: review findings addressed — the emitted route's row set covers
  the page it reads, the fixture test discriminates, and the README's run block
  spells the runner as the created repository resolves it
- Blockers: none
- Next: review
