---
'@lcabrera/vite-config': patch
---

The README now says that a workspace `vite.config.ts` sets `pack`, `run` and its Vite/Vitest config, and that `fmt`, `lint` and `staged` belong in the root config only. It used to list `fmt` among the workspace keys. A package-directory `vp fmt` applies a workspace `fmt` block that `vp check` never applies, so the same file could be formatted two ways.
