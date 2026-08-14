---
id: node-runtime-publish
title: Publish the Node runtime helpers as @lcabrera/node
owner: agent:claude
status: review
branch: chore/676-node-runtime-publish
area:
  - packages/node-runtime/**
  - packages/ts-configs/**
  - apps/api-server/**
  - apps/api-server-fast/**
  - apps/scan-orchestrator/**
  - scripts/lib/api-surface-config.mjs
  - scripts/lib/coverage-workspaces.mjs
started: 2026-08-14
updated: 2026-08-14
plan: (none)
pr: https://github.com/luciocabrera/vite-react-compiler/pull/717
issue: #676
---

## What

Publish the Node runtime helpers as `@lcabrera/node`, per
[ADR-069](../../decisions/ADR-069-publish-the-shared-toolchain.md). The
`packages/node-runtime` workspace becomes the published package; the directory
name is unchanged.

## Status / next

- Current step: implemented, gate green, PR open for review
- Blockers: none
- Known overlap: `scripts/lib/api-surface-config.mjs` is also claimed by
  `publishing-gate-artifact` (#715). Unavoidable and one line here — the new
  package's directory has to join `PUBLIC_PACKAGE_DIRS` or it is not under the
  API-surface ratchet. Whichever lands second re-adds the line.
- Next: verification, then merge. #678 is unblocked by this landing.
