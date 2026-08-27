---
id: shipped-docs-gate
title: Gate that shipped documents read with only their package on disk
owner: agent:claude
status: review
branch: feat/992-shipped-docs-gate
area:
  - packages/repo-standards/scripts/**
  - packages/repo-standards/package.json
  - packages/repo-standards/README.md
  - packages/repo-standards/ARCHITECTURE.md
  - packages/*/README.md
  - packages/ui/package.json
  - packages/server/package.json
  - packages/utils/package.json
  - packages/CLAUDE.md
  - scripts/lib/shipped-docs-tarball.test.mjs
  - docs/product/requirements/published-docs-ship-self-contained.md
  - devkit.config.json
  - COMMANDS.md
  - .github/workflows/check-safe.yml
  - package.json
started: 2026-08-27
updated: 2026-08-27
plan: (none)
pr: https://github.com/luciocabrera/lcabrera-stack/pull/1016
issue: #992
---

## What

`repo-verify-shipped-docs` packs every package in
`publishing.publicPackageDirs` and reads the markdown back out of the tarball,
so `files` decides the corpus rather than the working tree. `@lcabrera/ui`,
`@lcabrera/server` and `@lcabrera/utils` stop shipping the markdown beside their
source; the remaining published READMEs stop naming this repository's own tree.

## Status / next

- Current step: gate green, awaiting review
- Blockers: none
- Next: merge
