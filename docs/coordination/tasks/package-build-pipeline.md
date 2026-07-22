---
id: package-build-pipeline
title: Build api/server/utils to dist for publication
owner: agent:claude
status: review
branch: package-build-pipeline
area:
  - packages/api/package.json
  - packages/api/vite.config.ts
  - packages/server/package.json
  - packages/server/vite.config.ts
  - packages/utils/package.json
  - packages/utils/vite.config.ts
  - packages/vite-configs/**
  - scripts/verify-publish-surface.mjs
  - scripts/lib/publish-surface.mjs
started: 2026-07-22
updated: 2026-07-22
plan: (none)
pr: #259
issue: #256
---

## What

The last thing standing between the four public packages and a first release.
`@lcabrera/api`, `@lcabrera/server` and `@lcabrera/utils` now build to `dist` via
`vp pack`, with declarations and sourcemaps.

The reason is narrower than "packages ship dist": a `.ts` file inside
`node_modules` is not loadable at all, because Node refuses to strip types there
(`ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`), and Vite externalizes
dependencies for SSR by default. A source-shipping package therefore fails when
a consumer's server starts, not when it typechecks.

`@lcabrera/ui` is excluded and cannot be included: StyleX derives theme identity
from the source path, so the consumer's own plugin must compile it.

`exports` still points at `src`, so no workspace here has to build first; pnpm
substitutes `publishConfig.exports` at pack time. `publish:verify` keeps the two
maps in step, because only the first is ever exercised in this repo.

## Adding an export from here on

`ws-runs-auth` (#66) landed its `./tickets/*` exports before this branch was cut,
so they are already covered. Any _future_ subpath added to a built package needs
`vp run publish:verify -- --write` committed alongside it, or the gate fails with
"is in `exports` but not `publishConfig.exports`" — which is the whole point: a
new subpath consumers would never receive is exactly what it exists to catch.

## Status / next

- Current step: gate green; verified end to end by installing real tarballs into
  a scratch project and loading them under plain Node
- Blockers: none
- Next: Changesets adoption and `v0.1.0`.
