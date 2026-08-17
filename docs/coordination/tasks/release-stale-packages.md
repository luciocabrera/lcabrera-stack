---
id: release-stale-packages
title: Release the stale published packages
owner: agent:claude
status: review
branch: chore/741-release-stale-packages
area:
  - packages/**
  - .changeset/**
started: 2026-08-17
updated: 2026-08-17
plan: (none)
pr: 742
issue: #741
---

## What

Consume the pending changesets and version every published package, so the
registry stops disagreeing with the source at the same version number.

## Status / next

- Current step: PR #742 open for review, full gate green
- Blockers: none
- Next:
  - Merging publishes all eight packages automatically via OIDC — no OTP.
  - Then #690: repoint the extracted API repo at the new versions and confirm
    it builds against the registry. It is blocked until this merges.
