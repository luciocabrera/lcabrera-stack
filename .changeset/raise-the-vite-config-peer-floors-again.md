---
'@lcabrera/vite-config': minor
---

The peer ranges move to the versions this package is now exercised against: `eslint` `^10.12.0`, `typescript-eslint` `^8.71.0`, `eslint-plugin-react-dom` and `eslint-plugin-react-x` `^5.24.2`, `eslint-plugin-security` `^4.2.0` and `globals` `^17.13.0`.

**This is the breaking part:** each floor rises inside its major, so a consumer on a release below any of them, such as `eslint` 10.11, now gets an unmet peer and must move up to the floor.
