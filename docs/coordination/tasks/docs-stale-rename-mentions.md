---
id: docs-stale-rename-mentions
title: chore(tooling): fail a rename that leaves a stale bare filename in the docs
owner: agent:claude
status: active
branch: chore/614-docs-stale-rename-mentions
area:
  - scripts/verify-renamed-mentions.mjs
  - scripts/lib/renamed-mentions*.mjs
  - scripts/lib/docs-paths.mjs
  - scripts/lib/markdown-corpus.mjs
started: 2026-08-12
updated: 2026-08-12
plan: (none)
pr: '#616'
issue: #614
---

## What

chore(tooling): fail a rename that leaves a stale bare filename in the docs

A new `renames:verify` gate: the names a change renamed away become the tokens to
look for, which is what lets bare filenames be checked at all without the
corpus-wide noise that made them unchecked in the first place.

## Status / next

- Current step: implemented, gate proven to fire, running the full quality gate
- Blockers: none
- Next: PR description, then flip #616 out of draft
