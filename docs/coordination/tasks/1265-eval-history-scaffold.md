---
id: 1265-eval-history-scaffold
title: Scaffold @repo/eval-history with the envelope schema and content hashing
owner: agent:claude
status: review
branch: feat/1265-1265-eval-history-scaffold
area:
  - packages/eval-history/**
  - packages/ts-configs/tsconfig.entries.ts
  - COMMANDS.md
  - pnpm-lock.yaml
  - vite.config.ts
  - biome.jsonc
started: 2026-10-06
updated: 2026-10-06
plan: (none)
pr: '#1332'
issue: #1265
---

## What

Scaffold @repo/eval-history with the envelope schema and content hashing

## Status / next

- Current step: package, schema, hashing and tests committed; gate green apart from `adr:verify`, which fails on main's duplicate ADR-132 (fixed by #1334)
- Blockers: none
- Next: review
