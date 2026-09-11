---
id: release-the-pending-changesets
title: Version and publish the pending changesets
owner: agent:claude
status: review
branch: chore/1177-release-the-pending-changesets
area:
  - .changeset/**
  - packages/*/package.json
  - packages/*/CHANGELOG.md
started: 2026-09-11
updated: 2026-09-11
plan: (none)
pr: #1178
issue: #1177
---

## What

Version and publish the pending changesets

## Status / next

- Current step: versioned, gate running, PR open for review
- Blockers: none. `release:plan` reports every package `already on npm`, so the
  publish gate opens on merge.
- Next: merge; `release.yml` publishes the five bumped packages
