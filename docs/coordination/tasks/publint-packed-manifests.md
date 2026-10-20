---
id: publint-packed-manifests
title: build(tooling): check packed manifests with publint
owner: agent:claude
status: review
branch: build/1425-publint-packed-manifests
area:
  - scripts/verify-devkit-tarball.mjs
  - scripts/lib/devkit-*
  - pnpm-workspace.yaml
  - pnpm-lock.yaml
  - package.json
  - COMMANDS.md
  - README.md
  - AGENTS.md
  - packages/CLAUDE.md
  - docs/decisions/ADR-073-publishing-gates-check-the-packed-tarball.md
  - docs/product/requirements/the-shipped-setup-installs-and-works.md
started: 2026-10-20
updated: 2026-10-20
plan: (none)
pr: https://github.com/luciocabrera/lcabrera-stack/pull/1450
issue: #1425
---

## What

build(tooling): check packed manifests with publint

## Status / next

- Current step: publint runs inside `tarball:verify`; gate green
- Blockers: none
- Next: review
