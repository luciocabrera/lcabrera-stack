---
id: eslint-plugin-portable-options
title: Make the repo-coupled lint rules configurable ahead of publishing
owner: agent:claude
status: review
branch: feat/540-portable-lint-rule-options
area:
  - packages/eslint-local-rules/clean-import-paths.ts
  - packages/eslint-local-rules/clean-import-paths.test.ts
  - packages/eslint-local-rules/filename-convention.ts
  - packages/eslint-local-rules/filename-convention.test.ts
started: 2026-08-04
updated: 2026-08-04
plan: (none)
pr: (none)
issue: https://github.com/luciocabrera/vite-react-compiler/issues/540
---

## What

Stage 1 of #540: the two rules that hardcoded this repo's conventions now take
options, with today's values as defaults. No rename, no publishing yet.

## Status / next

- Current step: quality gate
- Blockers: none
- Next: PR, then stage 2 (restructure + manifest + rename + call sites)
