---
'@lcabrera/vite-config': patch
---

The `start` task from `createReactRouterRunConfig` now runs uncached (`cache: false`), as `test` and `test:coverage` already did. `start` serves until something stops it, so there is no finished run to replay. Tracking a cached task makes Vite Task create an IPC socket directory, a seccomp socket and a shared-memory file in the OS temp dir, and when a signal stops the server those three are left behind on every run. The command itself is unchanged.
