---
'@lcabrera/devkit': patch
---

A `monorepo`-rung tree now installs with no unmet peer. Its catalog pinned
`@babel/preset-typescript` to the 8 line, but `vite-plugin-babel`, which runs
the preset, peers on `@babel/core` 7. The install resolved a single
`@babel/core` 7 for both, and `pnpm peers check` reported every Babel 8 package
under the preset. The catalog now pins the preset to the 7 line. The web
application's Vite config passes the 7-line options (`allExtensions` and
`isTSX` in place of `ignoreExtensions`), so every file the Babel pass includes
still parses as TSX.

This needs a `@lcabrera/vite-config` whose peer range admits the preset's 7
line. The blueprint's `>=0.5.0 <1.0.0` range picks that release up once it is
published.
