---
'@lcabrera/server': patch
'@lcabrera/eslint-plugin': patch
'@lcabrera/devkit': patch
---

`@lcabrera/server` now declares `zod` at `^4.6.7`, and `@lcabrera/eslint-plugin` declares `@typescript-eslint/utils` at `^8.71.2`. In a repository it writes, `@lcabrera/devkit` now pins Node 26.12.0 in `.node-version` and pnpm 12.14.0 in the root manifest's `packageManager`, and the CI workflow `init` writes sets up Vite+ with `voidzero-dev/setup-vp` at the v1.21.2 commit.
