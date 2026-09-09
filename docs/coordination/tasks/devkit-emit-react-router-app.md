---
id: devkit-emit-react-router-app
title: Emit a React Router app consuming the packages from npm
owner: agent:claude
status: review
branch: feat/1076-devkit-emit-react-router-app
area:
  - .changeset/monorepo-rung-emits-an-application.md
  - .fallowrc.json
  - biome.jsonc
  - devkit.config.json
  - docs/agents/public-package-suppressions.json
  - docs/coordination/tasks/devkit-emit-react-router-app.md
  - docs/decisions/ADR-121-the-blueprint-offers-only-what-its-rung-delivers.md
  - docs/product/requirements/render-a-table-from-rows-alone.md
  - packages/devkit/ARCHITECTURE.md
  - packages/devkit/README.md
  - packages/devkit/assets/workspace/apps/**
  - packages/devkit/assets/workspace/gitignore
  - packages/devkit/assets/workspace/pnpm-workspace.yaml
  - packages/devkit/assets/workspace/packages/typescript-config/tsconfig.entries.ts
  - packages/devkit/scripts/closure.mjs
  - packages/devkit/scripts/closure-classify.mjs
  - packages/devkit/scripts/closure-modules.test.mjs
  - packages/devkit/scripts/workspace.mjs
  - packages/devkit/scripts/workspace-app.test.mjs
  - scripts/verify-devkit-tarball.mjs
  - scripts/lib/devkit-tarball.mjs
  - scripts/lib/devkit-tarball-consumer.test.mjs
  - scripts/lib/devkit-tarball-produced.mjs
  - vite.config.ts
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

- Current step: review findings addressed — the emitted grid now declares
  sorting and filtering off on every column, so it offers only the controls the
  page behind it can answer, and the `area` above covers every path the pull
  request touches
- Blockers: none
- Next: review
