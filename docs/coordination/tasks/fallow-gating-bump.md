---
id: fallow-gating-bump
title: build(deps): bump fallow so every rule set to error gates
owner: agent:claude
status: review
branch: build/1492-fallow-gating-bump
area:
  - pnpm-workspace.yaml
  - pnpm-lock.yaml
  - .fallowrc.json
  - .github/skills/fallow-code-checker/**
  - packages/server/src/INVENTORY.md
  - .github/workflows/check-safe.yml
  - AGENTS.md
started: 2026-10-25
updated: 2026-10-25
plan: (none)
pr: #1494
issue: #1492
---

## What

build(deps): bump fallow so every rule set to error gates

## Status / next

- Current step: fallow on 3.35.0, gate green, PR ready for review
- Blockers: none
- Next: review and merge
