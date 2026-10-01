---
id: scratch-registry-flake
title: fix(tooling): the created-tree gate's scratch registry intermittently stops answering
owner: agent:claude
status: active
branch: fix/1229-scratch-registry-flake
area:
  - scripts/verify-devkit-workspace.mjs
  - scripts/lib/devkit-workspace*.mjs
  - scripts/lib/registry*.mjs
  - scripts/lib/scratch-registry*.mjs
  - scripts/lib/devkit-registry-server*.mjs
  - docs/decisions/ADR-125-*.md
started: 2026-10-01
updated: 2026-10-01
plan: (none)
pr: '#1231'
issue: #1229
---

## What

fix(tooling): the created-tree gate's scratch registry intermittently stops answering

## Status / next

- Current step: fix committed; the scratch registry 404s paths it does not hold and the gate names a registry fault
- Blockers: none
- Next: verifier
