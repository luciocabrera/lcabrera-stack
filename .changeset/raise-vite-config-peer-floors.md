---
'@lcabrera/vite-config': minor
---

The peer floors move to the versions this package is exercised against: `eslint` `^10.14.0`, `eslint-plugin-security` `^4.2.1`, and `globals` `^17.14.0`. A consumer below one of those, such as `eslint` 10.13.0, gets an unmet peer and has to move up to the floor. The other peers are unchanged.
