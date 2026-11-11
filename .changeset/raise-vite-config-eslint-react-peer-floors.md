---
'@lcabrera/vite-config': minor
---

The peer floors move to the versions this package is exercised against: `eslint-plugin-react-dom` and `eslint-plugin-react-x` `^5.30.1`, and `typescript-eslint` `^8.72.2`. A consumer below one of those, such as `typescript-eslint` 8.72.1, gets an unmet peer and has to move up to the floor. The other peers are unchanged.
