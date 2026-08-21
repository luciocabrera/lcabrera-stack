---
id: gate-runtime-family-four
title: Extract the fourth gate family into the runtime package
owner: agent:claude
status: active
branch: feat/798-gate-runtime-family-four
area:
  - packages/repo-standards/**
  - devkit.config.json
  - scripts/verify-docs-paths.mjs
  - scripts/verify-script-size.mjs
  - scripts/verify-stray-configs.mjs
  - scripts/verify-renamed-mentions.mjs
  - scripts/lib/docs-paths.mjs
  - scripts/lib/docs-paths-baseline.mjs
  - scripts/lib/markdown-corpus.mjs
  - scripts/lib/renamed-mentions.mjs
started: 2026-08-21
updated: 2026-08-21
plan: (none)
pr: 863
issue: #798
---

## What

Move the fourth gate family into `@repo/repo-standards`, and record why two of
its five members stay behind.

Moved: script size, stray configs, documented paths (with the shared markdown
corpus). Stayed, with reasons in the package README: `verify-lint-plugins.mjs`
and `verify-suppressions.mjs` — their whole subject is this repository's
analyser topology, which is also why `lint-toolchain` is classified
repo-specific.

## Status / next

- Current step: in review on #863
- Blockers: none
- Next: merge once the review threads and checks are green

## Notes

The area was originally claimed as all of `scripts/lib/**`, which overlapped
`chore/865-reviewer-own-identity`. Narrowed to the four modules this branch
actually touches — the two gates that stayed are no longer in scope, so their
files are not claimed either.
