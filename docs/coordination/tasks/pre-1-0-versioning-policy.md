---
id: pre-1-0-versioning-policy
title: Say the packages are pre-1.0, and gate a changeset promoting one to 1.0.0
owner: agent:claude
status: review
branch: chore/895-pre-1-0-versioning-policy
area:
  - packages/CLAUDE.md
  - scripts/lib/publish-wiring.test.mjs
  - .changeset/aggregate-columns.md
started: 2026-08-24
updated: 2026-08-24
plan: (none)
pr: (none)
issue: #895
---

Found while cutting the release after #893: the pending changesets planned
`@lcabrera/ui` at `1.0.0`, from one `major` declaration. Changesets takes
`major` on a `0.x` package straight to `1.0.0`, so that is a stability claim
rather than a break report — and an npm version is permanent.

States the phase in `packages/CLAUDE.md`, gates it in `publish-wiring.test.mjs`,
and re-declares the changeset as `minor` so the release cuts `0.4.0`.
