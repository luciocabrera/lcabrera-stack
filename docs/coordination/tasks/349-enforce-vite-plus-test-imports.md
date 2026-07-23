---
id: 349-enforce-vite-plus-test-imports
title: Enforce vite-plus/test imports via no-restricted-imports
owner: agent:claude
status: review
branch: test/349-enforce-vite-plus-test-imports
area:
  - packages/vite-configs/eslint.restrictions.shared.mjs
  - packages/vite-configs/eslint.custom-rules.shared.config.mjs
  - packages/vite-configs/eslint.base-custom-rules.shared.config.mjs
started: 2026-07-23
updated: 2026-07-23
plan: (none)
pr: (none)
issue: #349
---

## What

Enforcement for ADR-045: a `no-restricted-imports` ban on `vitest`/`vitest/*`
(pointing at `vite-plus/test`) added to the shared restriction table and composed
into both the react and base ESLint configs. The base config had no
`no-restricted-imports` before, so the rule is added there fresh.

## Status / next

- Current step: ban wired into both configs; verified with a planted violation in
  a react (ui) and a node (utils) workspace — both fail with the ADR-045 message;
  clean tree reports zero findings. Running the gate.
- Blockers: none.
- Next: PR; closes out the vite-plus leverage effort (parts A/B/enforcement).
