---
id: package-app-references
title: Remove package→app references from the public package docs
owner: agent:claude
status: active
branch: chore/943-package-app-references
area:
  - packages/server/src/**/*.md
  - packages/ui/src/components/**/ARCHITECTURE.md
  - packages/eslint-local-rules/src/domain-folder-filename.test.ts
  - scripts/lib/package-app-references*.mjs
  - scripts/verify-package-app-references.mjs
started: 2026-08-25
updated: 2026-08-25
plan: (none)
pr: #944
issue: #943
---

## What

A published package must not point at one of this repo's apps: apps are the
harness, packages are consumed where no `apps/` directory exists. Clears the
remaining references and adds `package-refs:verify` so the class cannot return.

## Status / next

- Current step: sweep applied, gate written and probed, running the full gate
- Blockers: none
- Next: push, resolve review, merge
