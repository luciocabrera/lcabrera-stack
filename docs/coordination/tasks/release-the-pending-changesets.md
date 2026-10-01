---
id: release-the-pending-changesets
title: chore(release): version the packages from the pending changesets
owner: agent:claude
status: review
branch: chore/1239-release-the-pending-changesets
area:
  - packages/*/package.json
  - packages/*/CHANGELOG.md
  - .changeset/*.md
  - packages/devkit/assets/**/package.json
  - packages/devkit/assets/workspace/pnpm-workspace.yaml
  - packages/devkit/scripts/create.mjs
started: 2026-10-01
updated: 2026-10-01
plan: (none)
pr: (none)
issue: #1239
---

## What

chore(release): version the packages from the pending changesets

## Status / next

- Current step: versioned; release:plan, shipped-ranges:verify, tarball:verify and workspace:verify (full tree, Postgres) pass
- Blockers: none
- Next: maintainer approves the merge; release.yml publishes
