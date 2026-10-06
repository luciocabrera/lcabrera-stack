---
id: babel-core-declared
title: Declare the @babel/core the ui and showcase builds use
owner: agent:claude
status: review
branch: build/1331-babel-core-declared
area:
  - pnpm-workspace.yaml
  - pnpm-lock.yaml
  - packages/ui/package.json
  - apps/showcase/package.json
  - .changeset/**
  - packages/vite-configs/README.md
  - packages/vite-configs/package.json
  - packages/ui/README.md
  - packages/ui/config/vite.plugins.config.ts
  - apps/showcase/config/vite.plugins.config.ts
started: 2026-10-06
updated: 2026-10-06
plan: (none)
pr: '#1335'
issue: #1331
---

## What

Declare `@babel/core` in the workspaces that build with Babel, on the major
`vite-plugin-babel` peers on, so every Babel peer is met whatever order pnpm
resolves in.

## Status / next

- Current step: gate run, PR open for review
- Blockers: none
- Next:
