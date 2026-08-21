---
id: devkit-publishing-contract
title: Hold devkit to the publishing contract
owner: agent:claude
status: active
branch: feat/797-devkit-publishing-contract
area:
  - packages/devkit/package.json
  - packages/devkit/LICENSE
  - packages/devkit/README.md
  - packages/devkit/scripts/devkit.mjs
  - packages/devkit/scripts/devkit.test.mjs
started: 2026-08-21
updated: 2026-08-21
plan: (none)
pr: 862
issue: #797
---

## What

Hold `packages/devkit` to the publishing contract in `packages/CLAUDE.md`, and
fix the CLI's help handling.

The two CLI files were not in the original claim. They came in once packing the
tarball showed `devkit --help` exiting 1, and then that `devkit sync --help`
wrote into the consumer's tree — both reachable only from the same "what does a
consumer actually get" question this task exists to answer.

## Status / next

- Current step: in review on #862
- Blockers: none
- Next: merge once the review threads and checks are green
