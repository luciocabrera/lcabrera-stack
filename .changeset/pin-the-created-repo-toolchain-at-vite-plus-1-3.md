---
'@lcabrera/devkit': minor
---

The `workspace` blueprint pins `vite-plus` and the Vite core alias at `1.3.0`, and `vitest` at `5.0.5`, in the catalog and in the typescript-config package it writes. The `vite` and `vitest` overrides are keyed `vite@*` and `vitest@*`. A bare key also matches a `catalog:` reference, and `vp up` then rewrites that reference to a concrete version.

The `tinypool@2` override is gone. Vite+ 1.3.0 installs `oxfmt` 0.73.0, which depends on `tinypool` 2.2.0 exactly, past the 2.1.2 floor that override existed to reach.

The blueprint gitignore ignores `.vitest/`. Vitest 5 writes that directory, and without the entry a created repository reports it as untracked.

**Action needed:** a repository this release creates installs Vite+ 1.3 and Vitest 5. `devkit sync` refreshes an unedited blueprint to the same pins and the same gitignore.
