---
'@lcabrera/server': patch
'@lcabrera/eslint-plugin': patch
'@lcabrera/devkit': patch
---

`@lcabrera/server` now declares `zod` at `^4.6.5`, and `@lcabrera/eslint-plugin`
declares `@typescript-eslint/utils` at `^8.70.1`. `@lcabrera/devkit` pins Node
26.10.0 in the `.node-version` it writes into a new repository, and the CI
workflow it writes sets up Vite+ with `voidzero-dev/setup-vp` at the v1.21.1
commit.
