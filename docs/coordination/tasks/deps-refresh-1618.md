---
id: deps-refresh-1618
title: Refresh the catalog, take jsdom 31, fix the unicorn 79 predicate findings
owner: agent:claude
status: active
branch: build/1618-deps-refresh
area:
  - pnpm-workspace.yaml
  - pnpm-lock.yaml
  - .github/workflows/claude-review.yml
  - .changeset/raise-vite-config-eslint-react-peer-floors.md
  - .changeset/raise-eslint-plugin-typescript-eslint-utils.md
  - .changeset/devkit-jsdom-31-blueprint.md
  - .changeset/repo-standards-predicate-names.md
  - packages/devkit/assets/workspace/pnpm-workspace.yaml
  - packages/devkit/scripts/closure-classify.mjs
  - packages/devkit/scripts/command-create.mjs
  - packages/devkit/scripts/command-create-setup.mjs
  - packages/devkit/scripts/command-create-setup.test.mjs
  - packages/devkit/scripts/config.mjs
  - packages/repo-standards/scripts/conformance-references.cjs
  - packages/repo-standards/scripts/conformance-triggers.cjs
  - packages/repo-standards/scripts/publish-smoke.mjs
  - packages/ui/src/components/Table/Table.staticLayoutChrome.test.tsx
  - apps/showcase/src/routes/wide-alltypes-150/WideAlltypes150.constants.ts
started: 2026-11-11
updated: 2026-11-11
plan: (none)
pr: #1619
issue: #1618
---

## What

The `vp run deps:refresh` run (in-range bumps), jsdom 31, and fixes for
the `consistent-boolean-name` and `prefer-includes-over-repeated-comparisons`
findings eslint-plugin-unicorn 79 reports. Unicorn stays on 78:
`prefer-smaller-scope` and the published `includesRung` are decided in a
later PR. Vite+ stays on 1.4.0: 1.5.1 bundles oxlint 1.91.0, which has the
`react/immutability` regression oxc-project/oxc#28401, and 1.6.0 is inside
pnpm's release-age window today.

## Status / next

- Current step: `vp run check:safe`, then push and update the PR.
- Blockers: none.
- Next: delete this file when the PR merges.
