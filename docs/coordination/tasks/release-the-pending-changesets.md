---
id: release-the-pending-changesets
title: Release the pending changesets
owner: agent:claude
status: review
branch: chore/1183-release-the-pending-changesets
area:
  - packages/*/package.json
  - packages/*/CHANGELOG.md
  - .changeset/**
started: 2026-09-28
updated: 2026-09-28
plan: (none)
pr: #1184
issue: #1183
---

## What

Version the packages from the changesets pending after the dependency refresh (#1182), so the merge publishes them.

## Status / next

- Current step: versioned; PR up for review
- Blockers: none
- Next: merge #1184, which publishes; then close this claim
