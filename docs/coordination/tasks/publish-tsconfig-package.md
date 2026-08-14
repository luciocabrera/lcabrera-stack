---
id: publish-tsconfig-package
title: Publish the TypeScript config factory as @lcabrera/tsconfig
owner: agent:claude
status: review
branch: feat/674-publish-tsconfig-package
area:
  - packages/tsconfig/**
  - packages/ts-configs/**
  - packages/CLAUDE.md
  - packages/vite-configs/vite.lint.shared.config.ts
  - scripts/lib/api-surface-config.mjs
  - scripts/lib/affected-tests.mjs
  - scripts/lib/coverage-workspaces.mjs
  - docs/agents/public-package-suppressions.md
  - packages/eslint-local-rules/src/rules-have-tests.test.ts
  - AGENTS.md
  - CLAUDE.md
  - COMMANDS.md
  - .changeset/**
  - reports/api-surface/**
started: 2026-08-14
updated: 2026-08-14
plan: (none)
pr: https://github.com/luciocabrera/vite-react-compiler/pull/710
issue: #674
---

## What

Split `packages/ts-configs` per [ADR-069](../../decisions/ADR-069-publish-the-shared-toolchain.md):
the factories and the writer become the published `@lcabrera/tsconfig`
(`packages/tsconfig`), while `@repo/ts-configs` survives as the private host of
`tsconfig.entries.ts` and a one-line runner.

## Status / next

- Current step: implemented, gate green, PR open for review
- Blockers: none
- Next: merge

## Notes

`COMMANDS.md` is contended this wave (#689, #695). The edit here is only what the
change forces: the three workspace-count claims, the §5 row for
`packages/tsconfig`, and the `generate` note pointing at the new package.

Round 2 widened the area by one file — `eslint-local-rules`' ratchet comment,
a one-line workspace-count claim this change invalidated in a document no gate
reads (`commands:verify` checks COMMANDS.md only), now phrased count-free.

`.github/skills/quality-gate-workflow/SKILL.md` carries the same stale count and
was **deliberately left alone**: `.github/skills/**` is #677's claimed area
(`scan-report-portable`), and `coordination:verify` warns on the overlap. Routed
to that task rather than edited here.

The remaining overlap warning against #677 is structural and expected, not a
mistake either side can narrow away: both PRs add a new package, so both must
append to `packages/ts-configs/tsconfig.entries.ts`, the Oxlint runtime roster in
`packages/vite-configs/vite.lint.shared.config.ts`, and the coverage lists in
`scripts/lib/coverage-workspaces.mjs`. The additions are independent list
entries, so the second to merge needs a rebase, not a redesign.
