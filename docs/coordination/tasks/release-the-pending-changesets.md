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

- Current step: versioned, gate running
- Blockers: `create-lcabrera-stack` has never been published, so `release:plan`
  refuses the gate for every package until it is published by hand once and its
  trusted publisher is configured on npmjs.com. That must happen before this
  merges.
- Next: merge once the first publish has landed; `release.yml` does the rest
