---
id: created-manifest-format
title: Emitted manifest passes the produced repository's format check
owner: agent:claude
status: review
branch: fix/1125-created-manifest-format
area:
  - packages/devkit/scripts/workspace.mjs
  - packages/devkit/scripts/create.mjs
  - packages/devkit/scripts/workspace.test.mjs
  - packages/devkit/scripts/create.test.mjs
started: 2026-09-09
updated: 2026-09-09
plan: (none)
pr: #1126
issue: #1125
---

## What

`devkit create` wrote the root manifest with alphabetical keys, so `format:check`
— one of the tasks it had just emitted — failed on that file the first time a
consumer ran it. The order is now stated once and refuses a key with no place in
it.

## Status / next

- Current step: gate green, PR open for review
- Blockers: none
- Next: merge, then the release of #1064's Wave 2 changesets
