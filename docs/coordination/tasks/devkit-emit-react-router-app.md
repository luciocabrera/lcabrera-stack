---
id: devkit-emit-react-router-app
title: Emit a React Router app consuming the packages from npm
owner: agent:claude
status: review
branch: feat/1076-devkit-emit-react-router-app
area:
  - .changeset/monorepo-rung-emits-an-application.md
  - packages/devkit/ARCHITECTURE.md
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

The `monorepo` rung places an application: React Router in framework mode, a
page route rendering a table from static rows and an action route answering the
path the component library submits that table's persisted state to, through
`@lcabrera/ui`, `@lcabrera/api` and `@lcabrera/utils` declared as registry
semver ranges.

The catalog gains the entries that application needs (`@testing-library/react`,
`jsdom`, the babel toolchain the shared plugins config composes); the tsconfig
roster gains its two entries; the packed-tarball gate gains a check that no
produced file carries a `workspace:` specifier.

## Status / next

- Current step: review findings addressed — the application now routes the path
  the component library submits persisted state to, so a sort and a theme toggle
  are answered rather than left unmatched
- Blockers: none
- Next: review
