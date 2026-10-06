---
'@lcabrera/devkit': patch
---

The `workspace` blueprint's `pnpm-workspace.yaml` now overrides `tinypool@2` to `^2.1.2`. The `vite-plus` release the blueprint pins installs an `oxfmt` that pins `tinypool` exactly at 2.1.0, which carries two critical advisories (GHSA-5gmw-xhrv-c9v3, GHSA-85c8-ppgw-ccpr). Without the override a freshly created tree fails its own `deps:audit` task on first install.
