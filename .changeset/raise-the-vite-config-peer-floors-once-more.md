---
'@lcabrera/vite-config': minor
---

The peer ranges move to the versions this package is now exercised against: `typescript-eslint` `^8.71.2`, and `eslint-plugin-react-dom` and `eslint-plugin-react-x` `^5.28.0`.

**This is the breaking part:** each floor rises inside its major, so a consumer on a release below any of them, such as `eslint-plugin-react-x` 5.24, now gets an unmet peer and must move up to the floor.
