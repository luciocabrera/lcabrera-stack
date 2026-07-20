---
id: ui-form-field-builders
title: Promote enterprise-orders Form field-builders to a generic @repo/ui DSL
owner: agent:claude
status: active
branch: ui-form-field-builders
area:
  - packages/ui/src/components/Form/**
  - apps/react-router/src/routes/enterprise-orders/**
started: 2026-07-20
updated: 2026-07-20
plan: (none)
pr: #123
issue: #122
---

## What

Promote enterprise-orders Form field-builders to a generic @repo/ui DSL

## Status / next

- Current step: builders + factory built & tested in `@repo/ui/components/Form/builders`; enterprise-orders rewired; `orderFormFields`/`parseOrderIdParam` colocated into `utils/`; docs updated; gate green (fmt/oxlint/eslint/biome/typecheck/tests).
- Blockers: none
- Next: push, flip PR #123 to ready.
