---
'@lcabrera/devkit': patch
---

A repository devkit creates now pins pnpm 12.21.0 in the root manifest's `packageManager`, and the `workspace` blueprint pins Vite+ 1.7.0 with its `vite` alias on `@voidzero-dev/vite-plus-core@8.3.8000`, the core that Vite+ release depends on. The blueprint's `minimumReleaseAgeExclude` adds `@tsrs/*`, the platform binaries of the TypeScript compiler Vite+ 1.7 installs, so a fresh install on its release day leaves the file unchanged.

The blueprint drops its `peerDependencyRules` allowance for `vite` and `vitest`. It existed because the old core alias version did not satisfy plugins' `vite` peer ranges; core 8.3.8000 does, and the created tree installs with no unmet peer without it.
