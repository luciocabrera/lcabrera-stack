---
'@lcabrera/vite-config': patch
---

The optional `@babel/preset-typescript` peer now accepts the 7 line as well as
the 8 line (`^7.29.7 || ^8.0.1`). `./plugins` hands the preset to
`vite-plugin-babel`, and that plugin peers on `@babel/core` 7. With only the
8 line allowed, a project that installed the preset matching that core got an
unmet peer on this package, and a project that installed the 8 line got one on
every Babel 8 package under the preset.
