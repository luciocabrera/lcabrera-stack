---
id: local-gate-parity
title: Run the autofixable linters before the push and close the fallow gap
owner: agent:claude
status: review
branch: chore/1115-local-gate-parity
area:
  - .vite-hooks/**
  - vite.config.ts
  - package.json
  - COMMANDS.md
  - scripts/fallow-preflight.sh
  - packages/repo-standards/scripts/eslint-staged.mjs
  - packages/repo-standards/scripts/eslint-staged.test.mjs
  - packages/repo-standards/scripts/run-eslint-staged.mjs
  - packages/repo-standards/package.json
started: 2026-09-08
updated: 2026-09-08
plan: (none)
pr: #1116
issue: #1115
---

## What

Make the local gate run what CI runs. Three parts:

- Every autofixer runs at commit time, in sequence, under one `staged` glob:
  `vp check --fix`, then Biome `--write`, then `repo-eslint-staged`. Biome was
  check-only and ESLint did not run at all before a push.
- `repo-eslint-staged` (new bin in `@lcabrera/repo-standards`) lints a file list
  with the `eslint.config.mjs` that governs each path. There is no root ESLint
  config, which is why the pass could not run per-file before.
- `vp run fallow:preflight` runs the audit the way CI runs it, and the pre-push
  hook calls it. The fallow job was the gate `check-safe` failed on most, and it
  was the only gate with no local form.

`vp run fix` is the by-hand entry point: `lint:all` then `format:all`, so the
formatter is the last thing that writes.

## Status / next

- Current step: pushed, PR #1116 ready for review
- Blockers: none
- Next: the ESLint coverage hole in `packages/*/scripts` is separate work
