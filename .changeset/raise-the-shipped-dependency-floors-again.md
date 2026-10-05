---
'@lcabrera/server': patch
'@lcabrera/eslint-plugin': patch
'@lcabrera/devkit': patch
---

`@lcabrera/server` now declares `pg` at `^8.23.1`, and `@lcabrera/eslint-plugin` declares `@typescript-eslint/utils` at `^8.71.0`. `@lcabrera/devkit` pins pnpm 12.9.1 in the `packageManager` of the repository it writes, and the `full` rung's app declares `pg` at `^8.23.1`.
