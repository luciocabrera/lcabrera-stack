---
id: release-changesets
title: Adopt Changesets and automate publishing
owner: agent:claude
status: review
branch: release-changesets
area:
  - .changeset/**
  - .github/workflows/release.yml
  - .github/workflows/changelog.yml
started: 2026-07-22
updated: 2026-07-22
plan: (none)
pr: (none)
issue: #265
---

## What

Versioning and publishing for the four `@lcabrera/*` packages. Independent
versions; a changeset rides along with any change that affects consumers.

The version PR is opened by a person (`vp run release:version`) because a bot's
PR can never merge here — one opened with `GITHUB_TOKEN` does not trigger
`pull_request` workflows, so its required checks never run. Publishing is fully
automatic via `release.yml` using npm trusted publishing (OIDC, no `NPM_TOKEN`).

## Status / next

- Current step: gate green; version cascade verified by probe, then reverted
- Blockers: none for this PR
- Next: this PR is tooling only and cannot publish anything — every package is
  still `private: true`, which `changeset publish` skips. Cutting `v0.1.0` is a
  separate, deliberate PR that flips those flags, and it needs the manual first
  publish plus trusted-publisher configuration on npmjs.com first.
