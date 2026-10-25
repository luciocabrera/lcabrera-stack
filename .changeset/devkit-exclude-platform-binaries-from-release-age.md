---
'@lcabrera/devkit': patch
---

The `workspace` blueprint's `pnpm-workspace.yaml` now lists name patterns under `minimumReleaseAgeExclude` for the per-platform binaries its toolchain pins at exact versions: `@biomejs/cli-*`, `@oxfmt/binding-*`, `@oxlint/binding-*`, `@oxlint-tsgolint/*`, the `@voidzero-dev/vite-plus-<os>-*` packages, `@yuku-core/binding-*` and the `lightningcss-<os>-*` packages.

Each of these binaries is published a few minutes after the package that pins it. pnpm holds back any version younger than a day. When `minimumReleaseAge` is left at its default, pnpm is not strict about it: if a parent was a day old but one of its binaries was not, a fresh install took the parent, installed the binary anyway and appended `name@version` to `minimumReleaseAgeExclude`. A newly created tree then showed `pnpm-workspace.yaml` as modified after its first install. With the patterns in place, the binaries install without being written to the file. The parent packages still wait a day.
