---
id: 1192-blueprint-babel-peers
title: the monorepo blueprint installs no unmet peer
owner: agent:claude
status: review
branch: fix/1192-1192-blueprint-babel-peers
area:
  - packages/devkit/assets/workspace/**
  - scripts/verify-devkit-workspace.mjs
  - scripts/lib/devkit-workspace*
  - .changeset/**
  - packages/vite-configs/package.json
  - packages/vite-configs/README.md
  - COMMANDS.md
started: 2026-09-30
updated: 2026-09-30
plan: (none)
pr: '#1201'
issue: #1192
---

## What

the monorepo blueprint installs no unmet peer

## Status / next

- Current step: PR open
- Blockers: the created-tree gate stays red until a `@lcabrera/vite-config` with the widened preset peer is published
- Next: review
