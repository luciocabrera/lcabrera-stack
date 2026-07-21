---
id: lint-scoping-and-bans
title: 'fix(lint): apply component rules to .error-boundary files, ban state libs and export *'
owner: agent:claude
status: active
branch: fix/lint-scoping-and-bans
area:
  - packages/vite-configs/eslint.custom-rules.shared.config.mjs
  - apps/admin_system/src/root/**
  - apps/admin_system/src/routes/cqms/**
  - packages/ui/src/components/Table/index.ts
  - packages/ui/src/components/Form/contexts/index.ts
started: 2026-07-21
updated: 2026-07-21
plan: (none)
pr: (none)
issue: #180
---

## What

Three enforcement gaps:

- the component-integrity rules were scoped to the deprecated
  `.errorBoundary.tsx` suffix, so the five migrated `.error-boundary.tsx`
  files were silently exempt while admin_system's two stragglers stayed
  baselined
- nothing banned `zustand`/`redux`/`jotai`/`valtio`/`mobx` (Non-Negotiable
  Rule 5)
- nothing banned `export *` in a barrel

## Status / next

- Current step: implemented; rules verified with `eslint --print-config`,
  every affected workspace lints clean
- Blockers: none
- Next: open the PR
