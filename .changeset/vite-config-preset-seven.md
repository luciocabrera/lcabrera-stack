---
'@lcabrera/vite-config': patch
---

The optional `@babel/preset-typescript` peer now also accepts the major that
matches the `@babel/core` `vite-plugin-babel` peers on. `./plugins` hands the
preset to `vite-plugin-babel`. With only the newer major allowed, a project that
installed the preset matching that core got an unmet peer on this package, and a
project that installed the newer major got one on every Babel package under the
preset.
