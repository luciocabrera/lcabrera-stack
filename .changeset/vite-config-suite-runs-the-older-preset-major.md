---
'@lcabrera/vite-config': patch
---

The package's own build now declares `@babel/core` as a dev dependency, on the major `vite-plugin-babel` peers on, and its suite runs the older `@babel/preset-typescript` major that matches it. The README is updated to match. It now says the suite runs the older major, and that a project on that major passes `allowDeclareFields: true` alongside `allExtensions` and `isTSX` to keep a class field declared without an initializer. Peer ranges and the `./plugins` output are unchanged.
