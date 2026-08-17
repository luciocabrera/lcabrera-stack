---
id: registry-manifest-audit
title: Audit published package manifests against the registry
owner: agent:claude
status: review
branch: ci/733-registry-manifest-audit
area:
  - scripts/release-audit.mjs
  - scripts/lib/release-audit*.mjs
  - scripts/lib/registry-packument*.mjs
  - scripts/lib/publishable-workspaces.mjs
  - scripts/release-publish-plan.mjs
  - .github/workflows/release-audit.yml
  - docs/decisions/ADR-077-*.md
  - COMMANDS.md
  - package.json
started: 2026-08-17
updated: 2026-08-17
plan: (none)
pr: '#743'
issue: #733
---

## What

Add `vp run release:audit`: fetch each published `@lcabrera/*` manifest from the
registry and assert it is the shape this repo intends — no `./src/` export
target in a package this repo builds, and no `catalog:`/`workspace:` dependency
range anywhere. `publish:verify` cannot answer this: it packs with pnpm by
design, so a defect present only in an `npm pack` tarball is invisible to it
permanently (#730).

## Status / next

- Current step: implemented, full gate green, pushed to #743 (draft)
- Blockers: none
- Next:
  - Verification, then ready/merge by the caller.
  - The audit fails today on the pre-pnpm-path publishes. Clearing it needs
    `npm deprecate` on each, which takes registry credentials — a maintainer
    action, not a change here (ADR-077).
