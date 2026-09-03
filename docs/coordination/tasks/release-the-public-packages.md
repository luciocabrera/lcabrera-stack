---
id: release-the-public-packages
title: Version and publish the pending changesets
owner: agent:claude
status: review
branch: chore/1062-release-the-public-packages
area:
  - .changeset/**
  - packages/*/package.json
  - packages/*/CHANGELOG.md
started: 2026-09-03
updated: 2026-09-03
plan: (none)
pr: #1063
issue: #1062
---

## What

`vp run release:version` consumes the 14 pending changesets and bumps every
public package. Merging this runs `release.yml`, which publishes each bumped
version to npm and opens a GitHub Release per package.

Minor: `@lcabrera/ui` and `@lcabrera/server` to 0.6.0, `@lcabrera/repo-standards`
to 0.4.0, `@lcabrera/devkit` to 0.3.0. Patch: `api`, `eslint-plugin`, `node`,
`tsconfig`, `utils`, `vite-config`. Nothing reaches 1.0.0.

## Status / next

- Current step: versioned; running the gate before pushing.
- Blockers: none
- Next: merge, then confirm each version is on npm with `vp run release:plan`.
