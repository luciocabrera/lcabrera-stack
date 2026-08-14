---
id: publishing-gate-artifact
title: Verify a real artifact in the publishing gates
owner: agent:claude
status: review
branch: fix/715-publishing-gate-artifact
area:
  - scripts/verify-publish-surface.mjs
  - scripts/verify-attw.mjs
  - scripts/verify-api-surface.mjs
  - scripts/lib/publish-*
  - scripts/lib/attw-check*
  - scripts/lib/api-surface-config.mjs
  - scripts/lib/release-packer*
  - docs/decisions/**
  - COMMANDS.md
  - .github/workflows/release.yml
  - .github/workflows/check-safe.yml
  - packages/CLAUDE.md
started: 2026-08-14
updated: 2026-08-14
plan: (none)
pr: '#719'
issue: #715
---

## What

Verify a real artifact in the publishing gates: `publish:verify` packs each
public package with pnpm and checks the tarball a consumer would install (plus a
real import from outside the repo), and all three publishing gates fail on an
unbuilt tree instead of reporting a pass they did not earn. The pnpm-only
`publishConfig` substitution is asserted rather than assumed — ADR-072.

## Status / next

- Current step: in review — gate green, negative controls recorded on PR #719
- Blockers: none
- Next: review on PR #719
