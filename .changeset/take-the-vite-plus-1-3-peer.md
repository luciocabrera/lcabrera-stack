---
'@lcabrera/vite-config': minor
---

The `vite-plus` peer moves to `1.3.0`, the exact pin this package is built against. A consumer still on `0.3.0` gets an unmet peer and has to move up with it.

`createReactRouterRunConfig` nests the build task's `env` and `input` under `cache`. Vite+ 1.3 rejects those two keys beside a `cache` setting, so a build task that still returns them there fails while loading its task graph.

**This is the breaking part:** a caller that read `tasks.build.env` or `tasks.build.input` now finds them on `tasks.build.cache`, and the peer no longer admits Vite+ 0.3.
