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
- Import test utilities from `vite-plus/test` (e.g. `import { expect, test, vi } from 'vite-plus/test'`) — never from `vitest` directly. It re-exports the vite-plus-bundled Vitest, so the test runtime always matches the toolchain ([ADR-045](../../docs/decisions/ADR-045-vite-plus-test-imports.md), which retired the earlier `vitest`-direct rule). Playwright specs in `apps/showcase/e2e/` import from `@playwright/test`, live in that directory, and run with `vp run --filter showcase test:e2e`. Load and reload a grid through `openGrid` and `reloadGrid` in `e2e/grid.ts`, never a bare `page.goto` or `page.reload`: React reveals a streamed Suspense boundary after the `load` event, so until then the document holds both the visible skeleton table and the resolved one parked in a hidden container, and any strict `table` locator resolves two elements ([#1436](https://github.com/luciocabrera/lcabrera-stack/issues/1436)).
- Run tests from the workspace under test: `vp run test`. Each workspace's `test` task is `vp test run`, so the built-in `vp test run` in the same directory gives the same result; `vp run test` is preferred because it also covers a workspace whose task adds arguments.
- A workspace with tests needs its own `vite.config.ts`, even an empty one. Without it, `vp run --filter <workspace> test` launched from the repo root fails with Vitest's "failed to find the current suite" before any test runs.
- Run a single test file: `vp run test -- --reporter=verbose <path/to/file.test.tsx>`
- 80% minimum unit test coverage target.
- `vp lint` checks assertions in `*.test.ts`, `*.test.tsx`, `*.test.mjs` and `*.test.cjs` with Oxlint's `vitest` plugin ([ADR-042](../../docs/decisions/ADR-042-oxlint-config-at-the-root.md), amendment "Oxlint owns assertion hygiene in test files"). The plugin does not follow `require`, so write a new test file as an ES module that `import`s its test functions; a `.test.cjs` file is checked only where it calls the global `it`/`test`. Every test asserts, directly or through a helper whose name starts with `expect`. No `expect` sits inside an `if`, a `catch` or a ternary, and none sits in a hook: a `beforeAll` precondition throws an `Error` instead. Every `.toThrow()` takes an argument: the message, the error class, or `expect.objectContaining(...)` naming what identifies the refusal.
- A test that makes a directory under the OS temp dir removes it in an `afterEach`/`afterAll`, or a `finally` around the code that uses it, so it goes even when the test fails (#1440). A test body's last line is not cleanup: a failing assertion never reaches it. Reach for a helper that records what it made and drains it rather than writing another: `createFixtureRoots` in `packages/repo-standards/scripts/repo-fixtures.mjs` (root `scripts/` tests import it too), `scratchDirectories` in `packages/devkit/scripts/create-fixtures.mjs`, and `inScratchDirectory` in `evals/agent-sessions.mjs` for an eval runner's session. A directory made `chmod 000` is restored in a `finally` before the drain, or `rmSync` cannot list it.
- Store tests: use `createMockStore` from `packages/ui/src/utils/tests/createMockStore.util.ts` (inventory row: `packages/ui/src/INVENTORY.md` → `src/utils/tests/`).
- Script tests (`*.test.mjs` / `*.test.cjs` under `scripts/`): same `vite-plus/test` import, colocated next to the script or under `scripts/lib/`. Run them with `vp run test:scripts`. Structure, size, and purity of the scripts themselves live in [`.claude/rules/scripts.md`](./scripts.md).
