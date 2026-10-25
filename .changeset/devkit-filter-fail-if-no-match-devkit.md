---
'@lcabrera/devkit': patch
---

The root tasks the `monorepo` and `full` profiles write now pass `--fail-if-no-match` to every filtered run: `build`, `dev`, `start`, `tsconfig:generate` and `db:seed`. Without the flag, a `vp run --filter` that matches no workspace prints a warning and exits 0, so a renamed application or config workspace left these tasks passing having run nothing. Now they exit non-zero. `devkit sync` updates a task the tree still holds as this kit wrote it, and reports one the repository has edited rather than overwriting it.
