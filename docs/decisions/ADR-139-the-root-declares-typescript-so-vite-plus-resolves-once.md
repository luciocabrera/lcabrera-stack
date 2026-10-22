---
governs:
  - repository
---

# ADR-139 — The root manifest declares `typescript`, so the root and every workspace resolve one vite-plus instance

**Status:** Accepted

**Issue:** [#1452](https://github.com/luciocabrera/lcabrera-stack/issues/1452)

**Relates to:** [ADR-047](ADR-047-declare-optional-peer-dependencies.md) (declare an optional peer this repo relies on)

## Context

`@voidzero-dev/vite-plus-core`, which `vite-plus` depends on and which the
`vite` alias in the `build` catalog points at, lists `typescript` twice: as an
optional peer dependency, and as an optional dependency of its own on a
different TypeScript build than the catalog's. pnpm resolves the peer from the
dependent when the dependent provides it, and falls back to the package's own
dependency when it does not.

Every workspace declares `typescript: catalog:build`, so in a workspace the peer
resolves to the catalog's build. The root manifest declared `vite-plus` but not
`typescript`, so at the root the peer fell back to vite-plus-core's own build.
That one peer difference gave pnpm two peer variants of `vite-plus`,
`@voidzero-dev/vite-plus-core` and `vitest`, one linked from the root and one
from every workspace.

Two variants are two module graphs. `vp run --filter <workspace> test`, launched
from the root in a workspace with no `vite.config.ts`, ran the test runner from
the root's variant while the test file's `vite-plus/test` import resolved the
workspace's. The suite failed at its first `describe` call, before any test
ran, with the stack inside the root variant's module runner.

## Decision

The root `package.json` declares `"typescript": "catalog:build"` in
`devDependencies`, next to `vite-plus`. The root then provides the same peer
every workspace provides, and pnpm resolves a single `vite-plus` variant.
`pnpm why vite-plus -r --depth 0` reports one version and one instance for the
root and every workspace.

The declaration is load-bearing although nothing at the root imports
`typescript`. That is the shape ADR-047 describes for `@vitest/coverage-v8`:
the edge is what holds the resolution in place, so a "nothing uses this" audit
must not remove it.

## Consequences

- A root-launched test task and a workspace-launched one load the same Vitest,
  so a workspace without a `vite.config.ts` no longer fails for that reason.
  The rule that every test-bearing workspace keeps its own `vite.config.ts` is
  not changed here.
- The root resolves the catalog's TypeScript, not vite-plus-core's own build.
  In vite-plus-core only the bundled tsdown, which `vp pack` runs, loads
  `typescript`. Nothing at the root packs a library, and the workspaces already
  ran on the catalog's build. `oxlint-tsgolint`, the type-aware lint pass, is a
  separate dependency and is not affected.
- The cost is one more root devDependency that reads as unused. Removing it
  brings the split back without failing an install; the symptom shows up only
  as a test failure in a workspace that lacks its own config.
- The root manifest `@lcabrera/devkit` scaffolds already declares `typescript`
  beside `vite-plus`, so this aligns the repository with what it ships. No
  published package changes.

## Alternatives considered

- **Leave the split and keep an empty `vite.config.ts` in every test-bearing
  workspace.** Rejected: the config moves one task off the root's variant and
  leaves the second instance in the tree for every other path that crosses
  from the root into a workspace.
- **Override vite-plus-core's own `typescript` dependency** with a
  `@voidzero-dev/vite-plus-core>typescript` entry in `overrides`. Rejected: it
  rewrites a dependency the package chose rather than supplying the peer it
  asks for, and it is one more override to revisit on every vite-plus release.
  Declaring the peer at the root is how every workspace already satisfies it,
  and it changes only the root's resolution.

## References

- [#1452](https://github.com/luciocabrera/lcabrera-stack/issues/1452), with the `.pnpm` listing, the `pnpm why` output and the repro before and after
- [#1417](https://github.com/luciocabrera/lcabrera-stack/issues/1417) / [#1447](https://github.com/luciocabrera/lcabrera-stack/pull/1447), where the failure was found
- [#1460](https://github.com/luciocabrera/lcabrera-stack/issues/1460), which quotes the failure's message
