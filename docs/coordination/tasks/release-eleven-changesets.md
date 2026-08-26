---
id: release-eleven-changesets
title: chore(release): version the eleven pending changesets
owner: agent:claude
status: review
branch: chore/979-release-eleven-changesets
area:
  - .changeset/**
  - packages/*/package.json
  - packages/*/CHANGELOG.md
started: 2026-08-26
updated: 2026-08-26
plan: (none)
pr: #980
issue: #979
---

## What

chore(release): version the eleven pending changesets

## Status / next

- Current step: cut. Eleven changesets consumed, ten packages versioned, five at
  minor and five at patch, none leaving 0.x. `check:safe` exit 0 across all 75
  tasks including `tarball:verify`, and `release:plan` reports `will publish` for
  all ten.
- The lockfile does not move and that is correct, not an omission: every internal
  edge is `workspace:*`, and with `updateInternalDependencies: "patch"` there is
  no range for `changeset version` to rewrite.
- Blockers: none
- Next: merge #980, which publishes.
