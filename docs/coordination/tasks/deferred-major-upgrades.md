---
id: deferred-major-upgrades
title: Take the deferred major dependency upgrades
owner: agent:claude
status: review
branch: build/825-deferred-major-upgrades
area:
  - pnpm-workspace.yaml
  - .github/workflows/**
  - packages/vite-configs/src/eslint.rules.shared.mjs
started: 2026-08-20
updated: 2026-08-20
plan: (none)
pr: #826
issue: #825
---

## What

The majors the routine refresh (#822) deliberately left behind, taken one at a
time with the breaking change of each checked against how this repo actually
uses it: `eslint-plugin-unicorn` 72 → 73, `jsdom` 29 → 30, `actions/checkout`
6 → 7, `actions/setup-node` 5 → 7.

## Status / next

- Current step: full gate green; PR open for review.
- Blockers: none.
- Next: hold `typescript` 7 (#824) and `@changesets/cli` 3 until after 0.4.0 —
  neither belongs in a release-eve PR.
