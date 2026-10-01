---
'@lcabrera/devkit': patch
---

A `monorepo`-rung tree now installs with no unmet peer. Its catalog pinned
`@babel/preset-typescript` to a major newer than the `@babel/core` that
`vite-plugin-babel`, which runs the preset, peers on. The install resolved one
`@babel/core` for both, and `pnpm peers check` reported every Babel package
under the preset. The catalog now pins the preset to the major that matches
that core, and the web application's Vite config passes that major's options
(`allExtensions` and `isTSX` in place of `ignoreExtensions`), so every file the
Babel pass includes still parses as TSX.

This needs a `@lcabrera/vite-config` whose peer range admits that preset major.
The blueprint's range for that package picks the release up once it is
published.
