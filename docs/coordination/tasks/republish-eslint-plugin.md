---
id: republish-eslint-plugin
title: Bump @lcabrera/eslint-plugin so a publishable artifact exists
owner: agent:claude
status: review
branch: fix/730-republish-eslint-plugin
area:
  - packages/eslint-local-rules/package.json
started: 2026-08-15
updated: 2026-08-15
plan: (none)
pr: 734
issue: #730
---

## What

Bump `@lcabrera/eslint-plugin` from `0.1.0` to `0.1.1`. One line, no source change.

`0.1.0` is on npm in a state no consumer can use — `exports` pointing at
`./src/index.ts`, and an unresolved `catalog:lint` range — because it was
published with `npm publish` rather than `pnpm publish`, so neither pnpm
substitution ran. Packing this tree with pnpm already produces the correct
artifact, so the version bump exists only because an npm version is immutable.

## Status / next

- Current step: review — bumped, gated, PR open
- Blockers: the publish itself needs npm credentials, which this machine does
  not have (`npm whoami` → `ENEEDAUTH`). That step is the repository owner's.
- Next: merge, then `pnpm publish --access public` from
  `packages/eslint-local-rules` on a clean `main` checkout — never `npm publish`

Blocks `@lcabrera/vite-config`, which declares this package as its single
runtime dependency and cannot be installed from the registry until a working
version exists.

Known overlap, recorded rather than narrowed: `release-non-blocked-packages`
(branch `chore/617-release-non-blocked-packages`) claims this same manifest.
That claim is dead but its branch still exists, so the register still reads it —
PR #618 is **closed unmerged** and issue #617 is closed, and the claim has been
`review` since 2026-08-12. Nothing is in flight to collide with; the warning is
the register correctly reporting a branch nobody has cleaned up. Deleting that
branch is not this task's to do — a closed-unmerged branch is the only remaining
copy of its work.
