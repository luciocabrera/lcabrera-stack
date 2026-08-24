---
id: version-packages
title: Version the pending changesets — devkit 0.2.0 and five others
owner: agent:claude
status: review
branch: chore/898-version-packages
area:
  - .changeset/**
  - packages/*/package.json
  - packages/*/CHANGELOG.md
started: 2026-08-24
updated: 2026-08-24
plan: (none)
pr: (none)
issue: #898
---

`vp run release:version` output only: version bumps and generated changelogs.
Opened by hand rather than by the Changesets action, because a PR opened with
`GITHUB_TOKEN` triggers no `pull_request` workflows and so can never satisfy
its required checks.

Driver is `@lcabrera/devkit@0.2.0` — #893's CI toolchain hook cannot be adopted
by a consumer until it is on npm.
