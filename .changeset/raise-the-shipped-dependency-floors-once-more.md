---
'@lcabrera/server': patch
'@lcabrera/eslint-plugin': patch
'@lcabrera/devkit': patch
---

`@lcabrera/server` now declares `zod` at `^4.6.7`, and `@lcabrera/eslint-plugin` declares `@typescript-eslint/utils` at `^8.71.2`. `@lcabrera/devkit` pins Node 26.12.0 in the `.node-version` it writes into a new repository and pnpm 12.14.0 in the `packageManager` of its root manifest, and the CI workflow `init` writes sets up Vite+ with `voidzero-dev/setup-vp` at the v1.21.2 commit.
