---
id: local-rule-test-coverage
title: Give every custom ESLint rule a test, and revive the one that had gone dead
owner: agent:claude
status: active
branch: test/local-rule-coverage
area:
  - packages/eslint-local-rules/**
started: 2026-07-21
updated: 2026-07-21
plan: (none)
pr: (none)
issue: #202
---

## What

Five of the nine rules in `packages/eslint-local-rules` had no test. Four of the
nine gate on a filename suffix, so a naming-convention change can silently turn
one into a no-op — and a dead rule reports zero findings, exactly like compliant
code does.

That had already happened: `no-type-definitions-in-components` still matched
`.errorBoundary.tsx` after `filename-convention` replaced that spelling with
`.error-boundary.tsx`, so it fired on none of the repo's seven error boundaries.

## Status / next

- Current step: tests written for all five, suffix set shared via
  `component-files.ts`, `rules-have-tests.test.ts` added as the ratchet.
- Blockers: none.
- Next: quality gate, then PR.
