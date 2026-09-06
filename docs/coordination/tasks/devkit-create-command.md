---
id: devkit-create-command
title: create a new repository, not only initialise an existing one
owner: agent:claude
status: active
branch: feat/1074-devkit-create-command
area:
  - packages/devkit/scripts/create.mjs
  - packages/devkit/scripts/create.test.mjs
  - packages/devkit/scripts/command-create.mjs
  - packages/devkit/scripts/command-create.test.mjs
  - packages/devkit/scripts/devkit.mjs
  - packages/devkit/scripts/devkit.test.mjs
  - packages/devkit/README.md
  - packages/create-lcabrera-stack/**
  - reports/api-surface/devkit.txt
  - .changeset/devkit-create*.md
  - packages/devkit/scripts/command-init.mjs
  - packages/ts-configs/tsconfig.entries.ts
  - devkit.config.json
  - docs/decisions/ADR-110-publish-the-unscoped-initializer-as-a-shim.md
  - reports/api-surface/create-lcabrera-stack.txt
  - scripts/verify-devkit-tarball.mjs
  - scripts/lib/devkit-tarball.mjs
  - scripts/lib/devkit-tarball.test.mjs
  - AGENTS.md
  - COMMANDS.md
started: 2026-09-06
updated: 2026-09-06
plan: (none)
pr: #1101
issue: #1074
---

## What

create a new repository, not only initialise an existing one

## Status / next

- Current step: implemented; running the gate
- Blockers: none
- Next: verifier round
- Coordination: `scripts/verify-devkit-tarball.mjs`, `scripts/lib/devkit-tarball.mjs`,
  `scripts/lib/devkit-tarball.test.mjs` and `COMMANDS.md` overlap the live claim
  `gates-as-bins` (#1072). This task owns only the `create-lcabrera-stack`
  additions: the third entry in `DISTRIBUTED`, the `shimFindings` step and the
  `createShimFindings` decision beside it, and in `COMMANDS.md` the workspace
  count and the §5 row for the new workspace. It changes no gate wrapper and no
  bin, which is what `gates-as-bins` moves.
- `packages/devkit/scripts/command-init.mjs` is edited by one line: `applyInit`
  is exported so `create` sets a repository up through the same call `init`
  makes. No behaviour of `init` changes and no existing assertion moved.
