---
id: 344-vite-single-instance
title: Unify on a single Vite instance (alias vite → vite-plus core)
owner: agent:claude
status: review
branch: build/344-vite-plus-single-instance
area:
  - pnpm-workspace.yaml
  - apps/api-server/package.json
  - apps/api-server-fast/package.json
  - apps/shared/package.json
  - packages/plugins/package.json
  - packages/eslint-local-rules/package.json
  - packages/vite-configs/package.json
started: 2026-07-23
updated: 2026-07-23
plan: (none)
pr: (none)
issue: #344
---

## What

Part A of the vite-plus leverage effort: collapse the real-Vite + Vite+-core split
into one instance. Alias `vite` → `@voidzero-dev/vite-plus-core`, activate the
`overrides`/`peerDependencyRules`, add the direct `vite` devDep to every vite-plus
package that lacked one, pin toolchain versions. No source or test changes — the
`vitest`-direct import convention is untouched (that's part B, a separate issue).

## Status / next

- Current step: config + manifests done; gate green (typecheck:all, eslint,
  publish:verify, test:ci, fallow new-only). Opening PR.
- Blockers: none.
- Next: PR review; then close #344 and open part B (vite-plus/test + ADR).
