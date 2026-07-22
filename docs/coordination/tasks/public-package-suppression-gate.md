---
id: public-package-suppression-gate
title: Enforce zero unapproved suppressions in the four public packages
owner: agent:claude
status: active
branch: ci/308-public-package-suppression-gate
area:
  - scripts/lib/suppressions*
  - scripts/verify-suppressions.mjs
  - docs/agents/public-package-suppressions*
  - AGENTS.md
  - COMMANDS.md
  - package.json
  - .github/workflows/check-safe.yml
started: 2026-07-22
updated: 2026-07-22
plan: (none)
pr: #310
issue: #308
---

## What

Make "the four public packages are never silenced" a checked property instead of
a claim. It was enforced for the eslint baseline alone — gitignored, so CI has
nothing to check out — and for none of the other five mechanisms. `packages/ui`
held 17 inline directives and 6 targeted Biome rule-offs while AGENTS.md said it
held none.

## Status / next

- Current step: gate built and wired; register seeded with 15 evaluated entries
- Blockers: none
- Next: land #310; #311 tracks the 5 provisional entries down to zero
