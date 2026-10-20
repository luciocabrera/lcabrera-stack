---
'@lcabrera/vite-config': minor
---

The `test` and `test:coverage` tasks from `createReactRouterRunConfig` now run `vp test run` instead of invoking Vitest's binary by its `node_modules` path. The arguments are unchanged, and both tasks still run uncached. `vp test` resolves Vitest from vite-plus's own dependencies before the project's.

**This is the breaking part:** the Vitest that runs these tasks is the one `vite-plus` depends on, and `vp toolchain vitest` prints its version. The project's own `vitest` dependency no longer picks the runner, so upgrading `vite-plus` can move a plain `test` run to a different Vitest major. `test:coverage` passes `VITEST_COVERAGE_FLAGS`, which selects the v8 provider. Keep `@vitest/coverage-v8` at the version `vp toolchain vitest` prints, or the coverage run loads a provider built for a different Vitest.
