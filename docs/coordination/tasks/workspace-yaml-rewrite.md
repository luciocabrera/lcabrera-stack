---
id: workspace-yaml-rewrite
title: Find what rewrites pnpm-workspace.yaml in the created-workspace gate
owner: agent:claude
status: review
branch: test/1490-workspace-yaml-rewrite
area:
  - scripts/verify-devkit-workspace.mjs
  - scripts/lib/devkit-tree-run.mjs
  - scripts/lib/devkit-workspace*.mjs
  - packages/devkit/assets/**
  - packages/devkit/README.md
  - pnpm-workspace.yaml
  - scripts/lib/shipped-floors.mjs
  - docs/decisions/ADR-117-*.md
  - .github/skills/health-swarm/charters/deps.md
  - .changeset/devkit-exclude-platform-binaries-from-release-age.md
started: 2026-10-25
updated: 2026-10-25
plan: (none)
pr: '#1491'
issue: #1490
---

## What

Find what rewrites pnpm-workspace.yaml in the created-workspace gate

## Status / next

- Current step: option 3 applied — the blueprint excludes the exact-pinned platform-binary families from pnpm's release age, and workspace:verify fails on an exact optional pin no entry covers
- Blockers: none
- Next: review
