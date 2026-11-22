---
'@lcabrera/vite-config': minor
---

The `vite-plus` peer moves to `1.7.0`, the version this package is now exercised against. The lint and React Router peers raise their floors to the versions it is tested with: `eslint` `^10.15.0`, `typescript-eslint` `^8.73.0`, `eslint-plugin-perfectionist` `^5.14.0`, `eslint-plugin-react-dom` and `eslint-plugin-react-x` `^5.30.5`, `eslint-plugin-react-refresh` `^0.5.8`, `@react-router/dev` `^8.5.2`, and `@stylexjs/eslint-plugin` and `@stylexjs/unplugin` `^0.19.2`.

**This is the breaking part:** `vite-plus` is pinned exactly, so a consumer on 1.6.0 gets an unmet peer until it moves to 1.7.0.
