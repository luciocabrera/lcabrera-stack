---
id: release-the-pending-changesets
title: Version and publish the pending changesets
owner: agent:claude
status: review
branch: chore/1127-release-the-pending-changesets
area:
  - .changeset/**
  - packages/*/package.json
  - packages/*/CHANGELOG.md
started: 2026-09-09
updated: 2026-09-09
plan: (none)
pr: #1128
issue: #1127
---

## What

Version and publish the pending changesets

## Status / next

- Current step: gate green, CI green, open for review
- Blockers: none. `create-lcabrera-stack@0.1.0` was published by hand and its
  trusted publisher configured, so `release:plan` now reports every package
  `already on npm` and the publish gate opens.
- Next: merge; `release.yml` publishes the five bumped packages
