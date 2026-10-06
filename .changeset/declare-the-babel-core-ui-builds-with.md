---
'@lcabrera/ui': patch
---

The package's own build now declares `@babel/core` 7 as a dev dependency, and `@babel/preset-typescript` moves to the same major. `vite-plugin-babel` peers on `@babel/core` 7 while the version 8 preset peers on `@babel/core` 8, so with neither declared one peer was always unmet and which one depended on how the lockfile happened to resolve.

The README's Vite example now passes the version 7 preset options, `{ allExtensions: true, allowDeclareFields: true, isTSX: true }`, in place of `ignoreExtensions` and the `jsx` parser plugin. Under `@babel/core` 7, the version `vite-plugin-babel` requires, the old example fails to parse JSX in the package source. `allowDeclareFields` keeps a class field declared without an initializer, as the version 8 preset does by default. The shipped source is unchanged.
