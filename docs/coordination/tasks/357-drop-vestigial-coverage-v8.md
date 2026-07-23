---
id: 357-drop-vestigial-coverage-v8
title: Drop the vestigial @vitest/coverage-v8 declarations (vitest stays)
owner: agent:claude
status: review
branch: chore/357-drop-vestigial-coverage-v8
area:
  - apps/admin_system/package.json
  - apps/react-router/package.json
  - packages/api/package.json
  - packages/node-runtime/package.json
  - packages/scan-ingestion/package.json
  - packages/server/package.json
  - packages/utils/package.json
  - pnpm-workspace.yaml
started: 2026-07-23
updated: 2026-07-23
plan: (none)
pr: (none)
issue: #357
---

## What

Started as "remove the vestigial `vitest` devDeps left over from the
`vite-plus/test` switch (ADR-045)". **Verified empirically that `vitest` is NOT
vestigial** — every workspace's test task invokes the vitest binary _by path_
(`node node_modules/vitest/vitest.mjs run`, via the `vite.run.shared.config.ts`
factory), which needs a resolvable `node_modules/vitest`, i.e. a direct dep.
Removing it breaks the run (`packages/utils` failed with MODULE_NOT_FOUND).

What _is_ vestigial: `@vitest/coverage-v8`. vitest resolves the v8 provider from
vite-plus's own dependency tree at runtime, so the 7 workspace declarations (and
the catalog pin) are redundant — proven by `packages/ui`, which runs coverage
green with no declaration and the catalog entry pruned. Removed from the 7; the
catalog entry self-prunes (`cleanupUnusedCatalogs`).

## Status / next

- Current step: change complete + verified (ui canary, `coverage:merge` 8 wks,
  `test:ci` EXIT=0, `typecheck:all` EXIT=0). Opening PR.
- Blockers: none.
- Next: PR; then a separate evidence-based look at `maxWorkers`.
