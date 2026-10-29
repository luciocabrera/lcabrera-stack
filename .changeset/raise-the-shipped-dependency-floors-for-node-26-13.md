---
'@lcabrera/eslint-plugin': patch
'@lcabrera/devkit': patch
---

`@lcabrera/eslint-plugin` now declares `@typescript-eslint/utils` at `^8.72.1`. In a repository it writes, `@lcabrera/devkit` now pins Node 26.13.0 in `.node-version`, pnpm 12.16.1 in the root manifest's `packageManager`, and Vite+ 1.4.0 with the matching `vite` core alias in the `workspace` blueprint's catalog. The CI workflow `init` writes sets up Vite+ with `voidzero-dev/setup-vp` at the v1.22.0 commit.
