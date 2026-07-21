---
id: docs-paths-verify
title: 'feat(tooling): docs:verify — fail the gate on a documented path that does not exist'
owner: agent:claude
status: active
branch: feat/docs-paths-verify
area:
  - scripts/verify-docs-paths.mjs
  - scripts/lib/docs-paths.mjs
  - scripts/docs-paths-baseline.json
started: 2026-07-21
updated: 2026-07-21
plan: (none)
pr: (none)
issue: #173
---

## What

~230 tracked markdown files named repository paths that nothing verified, and
they rot on every extraction or rename. Adds `docs:verify`, wired into
`check:push`, `check:safe` and `check-safe.yml`.

Precision was the whole problem: a naive resolve-every-backtick pass reports 832
references on this repo, almost all conventions rather than paths. The gate
recognises only two unambiguous shapes — root-anchored paths and relative
markdown links — and skips gitignored targets, which are expected to be absent.

## Status / next

- Current step: implemented; both acceptance criteria verified empirically
- Blockers: none
- Next: open the PR
