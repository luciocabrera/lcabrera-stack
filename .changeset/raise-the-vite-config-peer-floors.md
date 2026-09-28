---
'@lcabrera/vite-config': minor
---

The peer ranges move to the versions this package is now exercised against:
`@react-router/dev` `^8.4.0`, `@stylexjs/eslint-plugin` and `@stylexjs/unplugin`
`^0.19.1`, `eslint` `^10.11.0`, `typescript-eslint` `^8.70.1`,
`eslint-plugin-perfectionist` `^5.12.1`, `eslint-plugin-react-dom` and
`eslint-plugin-react-x` `^5.20.8`, `eslint-plugin-react-refresh` `^0.5.7` and
`eslint-plugin-security` `^4.1.0`.

**This is the breaking part:** each floor rises inside its major, so a consumer
on a release below any of them, such as `eslint` 10.10 or `@react-router/dev`
8.3, now gets an unmet peer and must move up to the floor.
