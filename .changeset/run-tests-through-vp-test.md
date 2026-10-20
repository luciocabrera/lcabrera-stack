---
'@lcabrera/vite-config': patch
---

The `test` and `test:coverage` tasks from `createReactRouterRunConfig` now run `vp test run` instead of invoking Vitest's binary by its `node_modules` path. The arguments are unchanged, and both tasks still run uncached. `vp test` resolves Vitest from vite-plus's own dependencies before the project's.
