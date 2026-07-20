---
id: utils-package-parity
title: Bring @repo/utils to public-package parity: src/ domain grouping, 95% coverage gate, kebab-case enforcement
owner: agent:claude
status: active
branch: utils-package-parity
area:
  - packages/utils/**
  - packages/eslint-local-rules/**
  - packages/ts-configs/**
  - scripts/merge-coverage.mjs
  - scripts/coverage-report.mjs
started: 2026-07-20
updated: 2026-07-20
plan: (none)
pr: #125
issue: #124
---

## What

Bring `@repo/utils` to the same public-package tier as `@repo/ui`/`@repo/data-access`,
so the upcoming util consolidation lands in a proper home:

1. **kebab-case enforcement (no rule-off).** Add a `suffixCase` option to the shared
   `local-rules/filename-convention` rule; enable `{ suffixCase: { util: 'kebab-case' } }`
   in `packages/utils/eslint.config.mjs` instead of the current `'off'` (Rule 11).
2. **`src/` + domain folders + explicit per-file exports.** Move `merge-arrays`→`src/arrays/`,
   `merge-objects`→`src/objects/`; update `packages/ts-configs/generate.ts` (utils `include`
   `['**/*.ts']`→`['src']`) and regenerate; rewrite the `exports` map (domain-namespaced,
   explicit per file); update the one consumer (`vite-configs/viteConfigMerge.util.ts`); fix
   the `./merge` ARCHITECTURE drift.
3. **95% coverage gate.** New `packages/utils/vite.config.ts` with `test`/`test:coverage`
   run tasks; `test:coverage` carries `--coverage.thresholds.*=95` CLI flags (a `test`
   config block is not reliably surfaced by vite-plus's `defineConfig`); add `@repo/utils`
   to `scripts/merge-coverage.mjs` + `scripts/coverage-report.mjs`.
4. **Suppression-free by construction.** Add `.gitignore` (ignore `eslint-suppressions.json`),
   `git rm` the tracked empty one.

**Constraints discovered:**

- **Workspace cycle:** `@repo/vite-configs` depends on `@repo/utils`, so utils config files
  must import vite-configs helpers via **relative path** or inline them — never a bare
  `@repo/vite-configs` specifier (would break `vp run -r`). The eslint config already does this.
- **No coverage threshold exists repo-wide** (`VITEST_COVERAGE_FLAGS` = reporters only). The
  95% gate is net-new (CLI threshold flags on `test:coverage`); verified to bite via a
  negative coverage probe (dropping a function to uncovered failed the task at 66%).

Prereq for the follow-on sweep (moving pure utils into these domain folders).

## Status / next

- Current step: DONE — rule `suffixCase` option (+ tests, rebuilt), `src/` domain move,
  explicit per-file exports, vite.config 95% gate (probe-verified), scripts + docs. Gate
  green (fmt/oxlint/eslint/biome/typecheck:all/tests + commands/coordination/scripts verify).
- Blockers: none.
- Next: push; flip PR #125 to ready. The follow-on sweep branches off this once merged.
