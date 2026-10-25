---
governs:
  - repository
---

# ADR-139 — Resolve TypeScript 7 everywhere, and give only the ESLint toolchain TypeScript 6

**Status:** Accepted

**Issue:** [#1452](https://github.com/luciocabrera/lcabrera-stack/issues/1452)

**Relates to:** [ADR-047](ADR-047-declare-optional-peer-dependencies.md) (an optional peer this repo relies on is declared)

## Context

`@voidzero-dev/vite-plus-core` declares `typescript` as an optional peer and
also as an optional dependency of its own, on TypeScript 7. Every workspace
supplied the peer from the `build` catalog, which was on TypeScript 6. The root
declared `vite-plus` and not `typescript`, so there the peer fell back to
core's own TypeScript 7. That one difference gave pnpm two peer variants of
`vite-plus`, vite-plus-core and `vitest`: one for the root and one for every
workspace.

The two variants did not behave the same:

- A root-launched `vp run --filter <workspace> test` in a workspace without a
  `vite.config.ts` ran the module runner from the root's variant and the test
  file's `vite-plus/test` from the workspace's. It failed at the first
  `describe` with `TypeError: Cannot read properties of undefined (reading
  'config')`.
- `vp pack` picks its declaration emitter from the `typescript` its variant
  resolves. With TypeScript 7 it uses the `tsgo` generator, and with
  TypeScript 6 it uses the `tsc` compiler API. The same package emitted
  different `.d.mts` depending on whether the build was launched from the root
  (`vp run packages:build`, which is what the release workflow runs) or from
  inside the workspace.

The catalog stayed on TypeScript 6 because of the ESLint toolchain.
typescript-eslint caps its `typescript` peer below TypeScript 7 and refuses to
load on it, because TypeScript 7 ships no compiler API yet. `ts-api-utils`,
`@eslint-react/core` and `eslint-plugin-perfectionist`'s `sort-imports` load
the same API. `ts-api-utils` gets its `typescript` peer from
`eslint-plugin-react-x` and from the `@eslint-react/*` packages. Nothing else
in the tree needs TypeScript 6. `tsc` on TypeScript 7 type-checks every
workspace, React Router typegen accepts it, and the tools that load a compiler
API (`react-doctor`, `@arethetypeswrong/core`, `ts-morph`, `fallow`) bring
their own TypeScript.

## Decision

- The `build` catalog's `typescript` is TypeScript 7. The root manifest declares
  `typescript: catalog:build` beside `vite-plus`, so the root supplies the same
  peer as every workspace. That leaves one variant of `vite-plus`, vite-plus-core
  and `vitest`. `pnpm why vite-plus -r --depth 0` prints `Found 1 version of
  vite-plus`, and `tsgo` emits the declarations wherever the build starts.
- `.pnpmfile.cjs` gives the ESLint toolchain TypeScript 6. For the packages it
  names, its `readPackage` hook replaces the `typescript` peer with a dependency
  on TypeScript 6. A peer resolves from the dependent, so the hook is the only
  install-time switch that can split one importer's `typescript` this way.
  `pnpm peers check` reports no issues.
- The `packageExtensions` entry that gave `eslint-plugin-perfectionist` a
  `typescript` peer (#472) is gone. The plugin is in the hook's list, so it gets
  TypeScript 6 as a dependency.

No ESLint rule is turned off and no plugin is removed.
`vp run lint:eslint:verify` still requires the pass to report a planted
violation.

## Consequences

- The declarations each package publishes do not change, because the release
  build already ran `tsgo`. `vp run api-surface:verify` passes against the
  existing snapshots. An in-workspace `vp pack` now emits the same files as the
  root build.
- `tsc` in every workspace is TypeScript 7. A TypeScript 6 behaviour that a
  workspace relied on would now show up as a `typecheck` failure, not as a
  difference nobody saw.
- The hook names its packages one by one. A new ESLint plugin that loads the
  compiler API through a `typescript` peer resolves TypeScript 7 and crashes the
  pass until it is added. `lint:eslint:verify` reports that crash.
- The hook's TypeScript 6 range is a literal. `vp run deps:refresh` does not
  move it, because taze reads manifests and the catalog, not the hook.
- The lockfile records a checksum of `.pnpmfile.cjs`, so any edit to the file,
  a reformat included, makes `vp install --frozen-lockfile` fail until
  `vp install` rewrites the checksum. That install re-resolves the whole graph.
  Check the lockfile diff for packages the edit did not touch.
- What a consumer installs is unchanged. The scaffold `@lcabrera/devkit` writes
  ships its own catalog, still on TypeScript 6, and neither copies nor needs
  this hook.
- **Remove the hook** once typescript-eslint supports TypeScript 7
  ([typescript-eslint#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940))
  and the other plugins in its list load without the TypeScript 6 API.
  Removing it while one of them still needs that API crashes the ESLint pass,
  and `lint:eslint:verify` fails.

## Alternatives considered

- **A scoped `overrides` entry, `typescript-eslint>typescript` and the like.**
  Rejected on evidence: pnpm applied it to dependencies and not to the peer. The
  parser still loaded TypeScript 7.
- **A `packageExtensions` dependency on TypeScript 6** for the typescript-eslint
  packages. Rejected on evidence: when the dependent provides the peer, the
  peer wins over the added dependency, so the parser still loaded TypeScript 7.
- **The alias TypeScript's release notes suggest**, with
  `typescript: npm:@typescript/typescript6` in every manifest and TypeScript 7
  under another name for `tsc`. Rejected: vite-plus-core's peer would then
  resolve TypeScript 6, `vp pack` would switch from `tsgo` to the `tsc`
  generator, and the published declarations would change. Keeping `tsgo` would
  take a new option in the published `createPackConfig`, plus a path to the
  TypeScript 7 binary. The alias also edits every manifest instead of one hook.
- **Declare the catalog's TypeScript 6 at the root.** This gives one instance,
  but `tsc`'s API becomes the declaration emitter everywhere. The published
  `.d.mts` of `@lcabrera/server` and `@lcabrera/vite-config` change shape, and
  the API-surface gate classifies the server change as breaking.
- **Turn off the ESLint plugins that need TypeScript 6.** Rejected: that removes
  typescript-eslint's parser and rules, the React rule sets and import ordering
  from every workspace. The hook keeps all of them.

## References

- [#1452](https://github.com/luciocabrera/lcabrera-stack/issues/1452): the `.pnpm` listing, `pnpm why`, the probes and the per-tool results
- [#472](https://github.com/luciocabrera/lcabrera-stack/issues/472): the perfectionist crash on TypeScript 7
- [Announcing TypeScript 7.0, "Running Side-by-Side with TypeScript 6.0"](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0)
