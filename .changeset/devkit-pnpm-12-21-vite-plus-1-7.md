---
'@lcabrera/devkit': patch
---

A repository devkit creates now pins pnpm 12.21.0 in the root manifest's `packageManager`, and the `workspace` blueprint pins Vite+ 1.7.0 with its `vite` alias on `@voidzero-dev/vite-plus-core@8.3.8000`, the core that Vite+ release depends on. The blueprint's `minimumReleaseAgeExclude` adds `@tsrs/*`, the platform binaries of the TypeScript compiler Vite+ 1.7 installs, so a fresh install on its release day leaves the file unchanged.
