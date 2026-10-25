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
- `.pnpmfile.cjs` gives the ESLint toolchain TypeScript 6. Its `readPackage`
  hook replaces the `typescript` peer with a TypeScript 6 dependency for an
  installed package that matches either of two rules, which
  `scripts/lib/eslint-typescript.cjs` holds:
  - it peers on `eslint`, so it runs inside ESLint, beside a parser that needs
    TypeScript 6;
  - its own `typescript` peer range excludes the version the `build` catalog
    names.

  It keeps no list of packages, so a new ESLint plugin is covered the day it is
  installed. Workspace projects are skipped, because they declare their own
  `typescript`. A package that does neither keeps resolving the catalog's
  TypeScript 7. A peer resolves from the dependent, so the hook is the only
  install-time switch that can split one importer's `typescript` this way, and
  a package below a rewritten one, such as `ts-api-utils`, resolves its peer
  from it.

- The `packageExtensions` entry that gave `eslint-plugin-perfectionist` a
  `typescript` peer (#472) is gone. The plugin peers on `eslint`, so it gets
  TypeScript 6 as a dependency.
- The hook stops the install with an error, naming the package, its version and
  its range, when a package it would rewrite declares a `typescript` peer that
  excludes the TypeScript 6 it substitutes. That version is one constant,
  `TYPESCRIPT_6` in `scripts/lib/eslint-typescript.cjs`. The hook installs
  exactly that version, not a range, so the version it checks is the version
  pnpm resolves. A package's upper bound, such as typescript-eslint's `<6.1.0`,
  therefore cannot be crossed by a later TypeScript 6 release. It also stops the
  install on a `typescript` peer range it cannot read.
- The hook reads ranges with `scripts/lib/semver-range.cjs`, a dependency-free
  subset of `semver.satisfies`, because pnpm loads the hook before anything is
  installed. `scripts/lib/semver-range.test.mjs` compares it with `semver` across
  every operator, full and partial bounds, and prereleases. It also covers every
  `typescript` peer range the lockfile still records, plus the ranges the hook
  rewrites, which the lockfile no longer shows. It also checks that every range `semver` rejects
  makes it throw.
- `scripts/eslint-typescript.test.mjs` fails in these cases:
  - the lockfile has more than one `vite-plus` snapshot;
  - an `eslint`-peering package records no `typescript` dependency;
  - a package reachable from one resolves a `typescript` other than 6;
  - a package resolves `typescript` outside a peer range it still declares.
    The hook removes the peer from what it rewrites, so this check covers
    only packages the hook left alone. The throw above covers the rest.

  It also walks the installed tree. For each workspace with an
  `eslint.config.mjs`, it starts from every `eslint`-peering package the
  workspace declares and follows the `eslint`-peering packages each one depends
  on. Every package it reaches must find TypeScript 6 in the
  `node_modules` directory pnpm installed it into, not through pnpm's hidden
  hoist. A plugin that uses
  TypeScript without declaring it, as `eslint-plugin-perfectionist` does, fails
  this walk when the hook skips it.

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
- The `eslint` rule is wider than the set of packages that load the compiler
  API. `eslint-plugin-unicorn` and `eslint-plugin-react-dom` declare a
  `typescript` peer of `*` and import no API, but they get TypeScript 6 too.
  This is deliberate: the ESLint process already loads TypeScript 6 for the
  parser, and a `*` range cannot tell a plugin that works on TypeScript 7 from
  `@eslint-react/core`, which also declares `*` and crashes on it through
  `ts-api-utils`.
- A package that loads the compiler API without peering on `eslint` or
  declaring a `typescript` peer that excludes TypeScript 7 is not covered. If
  it sits below an ESLint plugin it resolves that plugin's TypeScript 6. If it
  sits anywhere else, nothing here reports it.
- The `TYPESCRIPT_6` constant is a literal. `vp run deps:refresh` does not
  move it, because taze reads manifests and the catalog, not the hook.
- The lockfile records a checksum of `.pnpmfile.cjs`, so any edit to the file,
  a reformat included, makes `vp install --frozen-lockfile` fail until
  `vp install` rewrites the checksum. That install re-resolves the whole graph.
  Check the lockfile diff for packages the edit did not touch.
- The checksum does not cover the modules the hook requires,
  `scripts/lib/eslint-typescript.cjs` and `scripts/lib/semver-range.cjs`. After
  an edit to either, `vp install` prints "Already up to date", and the lockfile
  test passes, because it reads the stale lockfile and the tree that lockfile
  installed. `vp run deps:lockfile` (`vp dedupe --check`) resolves again
  through the hook and exits non-zero on any difference, so it is the step that
  detects the drift: after an edit to the rules, run `vp dedupe`, then
  `vp run deps:lockfile` and the lockfile test. CI's Quality Gate
  and `check:safe` run `deps:lockfile`. The `pre-push` hook does not, because
  the check can need the registry and the hook must work offline
  ([#1496](https://github.com/luciocabrera/lcabrera-stack/issues/1496)).
- What a consumer installs is unchanged. The scaffold `@lcabrera/devkit` writes
  ships its own catalog, still on TypeScript 6, and neither copies nor needs
  this hook.
- **Remove the hook** once typescript-eslint supports TypeScript 7
  ([typescript-eslint#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940))
  and `ts-api-utils`, `@eslint-react/core` and `eslint-plugin-perfectionist`
  load without the TypeScript 6 API.
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
- **Keep the rules inside `.pnpmfile.cjs`**, so its checksum covers them.
  Rejected: it holds only while nobody adds a `require` to the hook, and the
  next one would reopen the gap with nothing to report it. The two modules also
  have tests of their own. A resolve-and-compare covers whatever the hook
  reads.
- **`vp install --fix-lockfile --lockfile-only` followed by a git diff.** It
  re-resolves and removes the stale entry, but it writes the lockfile, so a
  check built on it rewrites the working tree and cannot tell its own write from
  an uncommitted edit. `vp dedupe --check` reports without writing.
- **Turn off the ESLint plugins that need TypeScript 6.** Rejected: that removes
  typescript-eslint's parser and rules, the React rule sets and import ordering
  from every workspace. The hook keeps all of them.

## References

- [#1452](https://github.com/luciocabrera/lcabrera-stack/issues/1452): the `.pnpm` listing, `pnpm why`, the probes and the per-tool results
- [#1496](https://github.com/luciocabrera/lcabrera-stack/issues/1496): the stale-lockfile reproduction
- [#472](https://github.com/luciocabrera/lcabrera-stack/issues/472): the perfectionist crash on TypeScript 7
- [Announcing TypeScript 7.0, "Running Side-by-Side with TypeScript 6.0"](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0)
