---
id: domain-named-types-constants
title: refactor(packages): name single-domain types/constants after their directory
owner: agent:claude
status: active
branch: refactor/domain-named-types-constants
area:
  - packages/data-access/src/crypto/**
  - packages/data-access/src/filters/**
  - packages/ui/src/utils/security/**
  - packages/ui/src/utils/theme/**
  - packages/ui/src/utils/filters/**
  - packages/ui/src/routing/**
  - packages/ui/src/components/Table/commands/**
  - packages/ui/src/components/Table/filters/**
started: 2026-07-21
updated: 2026-07-21
plan: (none)
pr: (none)
issue: #141
---

## What

Rename eight `.types.ts` / `.constants.ts` files that sit in a single-domain
directory but are not named after it. The lint-enforcement half of #141 was
dropped after evidence showed a directory-match rule would fire on ~56 files,
most of them correct — see the issue.

## Status / next

- Current step: renames + consumer updates
- Blockers: none
- Next: quality gate
