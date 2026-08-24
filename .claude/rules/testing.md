---
paths:
  [
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.test.mjs',
    '**/*.test.cjs',
    '**/*.spec.ts',
    '**/*.spec.tsx',
  ]
---

# Testing Standards

- Tests colocated with the unit under test (`ComponentName.test.tsx`, `foo.util.test.ts`, `validate-skills.test.mjs`).
- Use `@testing-library/react` for component tests.
- Import test utilities from `vite-plus/test` (e.g. `import { expect, test, vi } from 'vite-plus/test'`) — never from `vitest` directly. It re-exports the vite-plus-bundled Vitest, so the test runtime always matches the toolchain ([ADR-045](../../docs/decisions/ADR-045-vite-plus-test-imports.md), which retired the earlier `vitest`-direct rule).
- Run tests from the workspace under test: `vp run test`. Never use `vp test` — this repo defines a custom `test` task (`node node_modules/vitest/vitest.mjs run`) to avoid the `vp test` OXC transform bug with `erasableSyntaxOnly: true`.
- Run a single test file: `vp run test -- --reporter=verbose <path/to/file.test.tsx>`
- 80% minimum unit test coverage target.
- Store tests: use `createMockStore` from `packages/ui/src/utils/tests/createMockStore.util.ts` (inventory row: `packages/ui/src/INVENTORY.md` → `src/utils/tests/`).
- Script tests (`*.test.mjs` / `*.test.cjs` under `scripts/`): same `vite-plus/test` import, colocated next to the script or under `scripts/lib/`. Run them with `vp run test:scripts`. Structure, size, and purity of the scripts themselves live in [`.claude/rules/scripts.md`](./scripts.md).
