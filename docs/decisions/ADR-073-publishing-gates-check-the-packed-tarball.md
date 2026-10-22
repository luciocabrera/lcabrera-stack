# ADR-073 — Check the packed tarball, and assert the pnpm publish path

**Status:** Accepted

**Date:** 2026-08-14
**Issue:** [#715](https://github.com/luciocabrera/lcabrera-stack/issues/715)
**Relates to:** [ADR-057](./ADR-057-publish-the-custom-lint-rules.md),
[ADR-043](./ADR-043-release-tooling-changesets-over-pnpm-native.md),
[ADR-038](./ADR-038-public-package-topology-by-runtime.md)

## Context

The `@lcabrera/*` packages are published by CI on a merged version bump, with no
human between a bad manifest and the registry, and an npm version is permanent.
Three gates stand in that path: `publish:verify`, `api-surface:verify` and
`attw:verify`.

The built packages keep `exports` pointing at `src`, so nothing in this repo has
to build before it can typecheck, test or run, and put the `dist` map in
`publishConfig.exports` — because a `.ts` file inside a consumer's
`node_modules` is not loadable at all (`ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`).

## Problem

Two independent ways for those gates to report success having established
nothing, both found while verifying [#710](https://github.com/luciocabrera/lcabrera-stack/pull/710).

1. **A skipped gate read as a passed gate.** On a tree where the packages had
   not been built, all three exited 0. `attw:verify` announced that published
   types resolved for every package having checked none of them; the other two
   reported their skips as a parenthetical. A fresh worktree — precisely where
   verification happens — starts unbuilt.
2. **The guarantee was tool-conditional and unasserted.** `publishConfig` field
   overrides are a pnpm extension, not npm behaviour. `npm pack` produces a
   tarball whose `exports` still point at `./src/*.ts`; installing it outside
   this repo fails with exactly the error the manifest exists to prevent. The
   gate read `package.json` from disk, so it validated an intention that only
   the publish path — `changeset publish` shelling out to `pnpm publish` — turns
   into a fact.

Both were properties of the gates, not of any one package.

## Options considered

1. **Keep reading the manifest, and document the pnpm dependency.** Rejected:
   the failure this protects against is unrecoverable, and a documented
   assumption is not an asserted one.
2. **Make the manifest correct under npm too**, by pointing `exports` at `dist`
   and resolving `src` in-repo through a custom condition. Rejected: it makes
   every workspace's resolution depend on toolchain-wide condition configuration
   to gain independence from a package manager the repo already pins.
3. **Pack the real tarball and check that, plus assert the publish path stays
   pnpm.** _Chosen._

## Decision

`publish:verify` packs every in-scope package with pnpm, reads the tarball back,
and checks the artifact: the `exports` a consumer would get, the files that are
really in it, and — for the packages whose runtime dependencies are packed
alongside them — a real `import` of every published subpath from a temporary
directory outside this repo. A target still pointing at `src`, or absent from
the tarball, fails.

The npm-versus-pnpm dependency is **asserted, not removed**. The same gate
requires the root `pnpm-lock.yaml` (which is how changesets picks its publish
tool), a `pnpm@` `packageManager` pin, and a release workflow that still runs
`pnpm exec changeset publish` and no `npm publish`/`npx`. Switching the release
tooling therefore fails the gate that the switch would silently invalidate.

**A package that is not built is a failure in all three gates**, not a skip.
There is no outcome in which a publishing gate exits 0 having produced or read
no artifact. Three states enforce that, and each is a failure rather than a zero
in the output: no package in scope, no package importable without a registry,
and a package that reaches the consumer lane yet contributes no subpath to
import. The last is not reachable from today's manifests — nor was the unbuilt
tree, until a fresh worktree made it routine.

The tarball is produced by spawning pnpm directly. `vp` does not wrap npm
packing — its own `vp pack` is a Vite library build — so this is the exception
AGENTS.md §4 already allows, alongside `pnpm clean`.

## Consequences

- `publish:verify` now needs a build **and** pnpm on PATH. Run it through
  `vp run publish:verify`, which puts the toolchain's pnpm there; run outside
  `vp`, it fails rather than degrading to a manifest check.
- It costs a pack per package (a few seconds in total) on every `check:safe`.
- The consumer import covers the packages whose dependencies are packed with
  them; one with an external runtime dependency (`pg`, `zod`,
  `@typescript-eslint/utils`) is packed and read but not imported, since doing
  so would need a registry. That leaves the largest published package checked
  only through attw's simulated layout, which is the real cost of keeping the
  lane registry-free.
- A package can therefore be in the lane and still import nothing, if its every
  subpath becomes a wildcard or a linked asset. That is a failure, not a quiet
  zero: an asset-only public package may be a legitimate reason to import
  nothing, but it has to be decided in this gate rather than inferred from a
  count.
- Editing the release workflow's publish step now has a second place to update.
  That is the point: the comment there names this ADR.
- `attw:verify` still assembles its installed layout from `dist` plus
  `publishConfig` rather than from a tarball. That layout is a simulation of the
  pnpm substitution — which `publish:verify` now checks against the real
  artifact, so the assumption is no longer unexamined.

## Alternatives considered

- **Assert the release path only**, without packing. Rejected on evidence: a
  planted `files` entry excluding one built file left every manifest-level check
  green while the tarball was missing the file a subpath exported.
- **`npm pack` in the gate as well, asserting its tarball is broken.** Rejected:
  it pins today's npm behaviour as a requirement, and a future npm that honoured
  `publishConfig` would fail the gate for improving.
- **Install with a package manager in the smoke run** rather than laying the
  tarballs out as `node_modules` by hand. Rejected: it needs a registry, which
  makes a network outage look like a publishing defect.

## Amendments

**2026-10-20 — publint reads each packed tarball (#1425).** `tarball:verify`,
the packed-artifact gate for the packages that ship `.mjs` and do not build,
now runs publint at error level over each tarball it packs, before installing
them. Its own check reads an `exports` target one condition deep; publint
resolves every condition at any depth, so a nested target the tarball does not
hold now fails there too. It reads the tarball rather than the directory, which
keeps the check on the artifact this ADR is about. The same run lints a planted
tarball whose only export points at a missing file, and fails if publint
reports nothing for it, so a clean result is never a check that did not run.
publint runs inside the verifier, not through `vp pack`'s `pack.publint`
option: these packages are not built by `vp pack`, and `attw:verify` stays the
types gate for the ones that are.

**2026-10-22 — publint reads every public package's tarball (#1453).**
`tarball:verify` runs before `packages:build`, so the packages that build to
`dist` were never linted, and their `exports`/`publishConfig.exports` split is
where a wrong target is most likely. `publint:verify` runs after the build,
packs each package `vp run suppressions:packages` lists with pnpm, so
`publishConfig.exports` is substituted as it is at release, and lints each
tarball through the same module, planted control included. The source-shipping
packages are linted by both gates; `tarball:verify` is unchanged, because it
must still pass where nothing has been built.

## References

- Issue [#715](https://github.com/luciocabrera/lcabrera-stack/issues/715) —
  both mechanisms, with the reproduction that found them.
- [ADR-057](./ADR-057-publish-the-custom-lint-rules.md) — the `publishConfig`
  swap and the hazard it prevents.
- [ADR-043](./ADR-043-release-tooling-changesets-over-pnpm-native.md) — why
  changesets, whose lockfile detection this ADR now depends on out loud.
- [`packages/CLAUDE.md`](../../packages/CLAUDE.md) — the publishing contract a
  manifest edit has to satisfy.
