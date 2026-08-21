---
id: devkit-distribution-gates
title: Gate the three distribution failures in CI
owner: agent:claude
status: active
branch: ci/801-devkit-distribution-gates
area:
  - packages/devkit/scripts/**
  - scripts/verify-devkit-tarball.mjs
  - scripts/lib/devkit-tarball.mjs
  - .github/workflows/check-safe.yml
  - COMMANDS.md
  - .devkit-accepted.json
started: 2026-08-21
updated: 2026-08-21
plan: (none)
pr: 867
issue: #801
---

## What

Gate the three ways this setup can break for a consumer while passing here.

The closure gate was already wired. This adds the drift gate — which needed
acknowledgement widened to cover `conflict`, or it could never be green on a
correct tree — and the packed-tarball smoke test.

## Status / next

- Current step: gates written and green locally; PR open as a draft
- Blockers: `tarball:verify` reports `@repo/repo-standards` shipping its test
  suite. The fix is that package's `files`, which belongs to #798's acceptance
  criterion 1 and is on `feat/798-gate-runtime-family-four` (#863). Rebase once
  that merges, then flip to ready.
- Next: rebase on main after #863, run `tarball:verify` green, mark ready
