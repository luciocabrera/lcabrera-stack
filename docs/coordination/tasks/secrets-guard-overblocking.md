---
id: secrets-guard-overblocking
title: fix(tooling): the secrets guard denies process.env and file:line template references
owner: agent:claude
status: review
branch: fix/983-secrets-guard-overblocking
area:
  - scripts/lib/secrets-guard*.mjs
started: 2026-08-27
updated: 2026-08-27
plan: (none)
pr: #984
issue: #983
---

## What

Two false-positive classes in the PreToolUse secrets guard, both reproducible
from a plain command with no heredoc and no quoting:

- `<chain>.env` was read as a filename, so `grep -rn process.env src/` and
  `grep -rn import.meta.env packages/` were denied outright.
- A trailing `:line[:col]` reference defeated the `.example`/`.sample`/
  `.template` carve-out the guard's own deny message advertises, so
  `.env.example:11` was denied as suffix `.example:11`.

Distinct from the heredoc gap documented in `secrets-guard.mjs`, which is
deliberate, test-pinned, and unchanged here.

## Status / next

- Current step: gate green (`vp run check:safe`, exit 0), PR #984 ready for review
- Blockers: none
- Next: merge once review and CI are green
