---
'@lcabrera/vite-config': minor
---

The peer ranges move to the versions this package is now exercised against: `vite-plus` `1.4.0` (exact), `@react-router/dev` `^8.5.1`, `eslint` `^10.13.0`, `typescript-eslint` `^8.72.1`, `eslint-plugin-perfectionist` `^5.13.0`, and `eslint-plugin-react-dom` and `eslint-plugin-react-x` `^5.28.8`.

**This is the breaking part:** `vite-plus` is pinned exactly, so a consumer on 1.3.0 gets an unmet peer until it moves to 1.4.0. Every other floor rises inside its major, so a consumer below one of them, such as `eslint` 10.12, gets an unmet peer and must move up to the floor.
