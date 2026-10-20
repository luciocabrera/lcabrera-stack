---
'@lcabrera/devkit': patch
---

The workspace templates no longer run Vitest by its `node_modules` path. The `typescript-config` package's `test` script is `vitest run`, and the `full` application's `test:smoke` is `SMOKE_DB=1 vitest run .smoke.`. That script no longer passes the compose environment file to `node`: the application's `vite.config.ts` already loads it when Vitest reads the config, and it does not override a variable the shell already set. The application's `test` task comes from `@lcabrera/vite-config`, which now runs `vp test run`.

One created tree now runs two Vitest binaries. The application's `test` task runs the Vitest that `vite-plus` depends on. `test:smoke` and the `typescript-config` package's `test` run the tree's own `vitest`. Keep the `vitest` entry in the `test` catalog at the version `vp toolchain vitest` prints, so the two stay the same release.
