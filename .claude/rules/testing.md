---
paths: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx']
---

# Testing Standards

- Tests colocated with components (`ComponentName.test.tsx`).
- Use `@testing-library/react` for component tests.
- Import test utilities from `vitest` (e.g. `import { expect, test, vi } from 'vitest'`) — never from `vite-plus`.
- Run all tests: `vp run test` (from `apps/react-router/`). Never use `vp test` — this repo defines a custom `test` task (`node node_modules/vitest/vitest.mjs run`) to avoid the `vp test` OXC transform bug with `erasableSyntaxOnly: true`.
- Run a single test file: `vp run test -- --reporter=verbose <path/to/file.test.tsx>`
- 80% minimum unit test coverage target.
