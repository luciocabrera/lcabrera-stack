---
'@lcabrera/server': patch
'@lcabrera/eslint-plugin': patch
'@lcabrera/vite-config': patch
'@lcabrera/devkit': patch
---

`@lcabrera/server` now declares `zod` at `^4.6.5`, and `@lcabrera/eslint-plugin`
declares `@typescript-eslint/utils` at `^8.70.1`. `@lcabrera/vite-config` raises
the floors of its peer ranges: `@react-router/dev` `^8.4.0`, the StyleX eslint
plugin and unplugin `^0.19.1`, `eslint` `^10.11.0`, `typescript-eslint`
`^8.70.1`, `eslint-plugin-perfectionist` `^5.12.1`, `eslint-plugin-react-dom` and
`eslint-plugin-react-x` `^5.20.8`, `eslint-plugin-react-refresh` `^0.5.7` and
`eslint-plugin-security` `^4.1.0`. `@lcabrera/devkit` pins Node 26.10.0 in the
`.node-version` it writes into a new repository.
