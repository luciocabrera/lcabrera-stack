---
governs:
  - repository
---

# ADR-125 — The created-tree gate installs the checkout's packages; the registry is checked after a release

**Status:** Accepted

**Issue:** [#1205](https://github.com/luciocabrera/lcabrera-stack/issues/1205)
**Relates to:** [ADR-073](./ADR-073-publishing-gates-check-the-packed-tarball.md)

## Context

`vp run workspace:verify` creates a `monorepo`-rung tree with `devkit create`,
installs it, and runs the tasks the tree wires for itself. It packed only
`@lcabrera/devkit`. Every other `@lcabrera/*` package the tree declares came
from the registry.

That made the gate check two things at once: the blueprint in this checkout,
and the packages npm served that day. When a change moves the blueprint and a
package together, for example a blueprint dependency that a package's peer
range must widen to admit, the gate installed the old package from npm and
failed. The change could not pass until the other package was published, so
every such fix needed a release in the middle of it.

## Options considered

1. **Release the package first, then merge the blueprint change.** Rejected: a
   publish becomes a step inside a pull request, an npm version is permanent,
   and the released package is untested against the blueprint it was released
   for.
2. **Merge with the required check red.** Rejected: a required check that is
   sometimes expected to fail is read like one that never runs.
3. **Install every `@lcabrera/*` package from a tarball packed from the
   checkout, and check the registry separately after a release.** _Chosen._

## Decision

`workspace:verify` walks every `@lcabrera/*` package the created tree declares,
and every one those declare in turn, and packs each from this checkout with
`pnpm pack` after `vp run packages:build`. It writes `overrides` pointing at
those tarballs into the scratch tree's `pnpm-workspace.yaml`, and never into the
blueprint.

An override replaces the declared range, so the gate checks the ranges itself
before installing. Every declaration of a packed package, in the tree's
manifests, through its catalogs, and in the other packed manifests, must admit
the packed version. A range that does not is a finding, not a silent pass. After
the install, the gate reads the tree's lockfile and fails, naming the package,
if any `@lcabrera/*` package resolved from anywhere other than a packed tarball.
A package the tree resolves that has no workspace in this checkout fails before
anything is packed.

`vp run registry-tree:verify` is the other half. It creates the tree with
the published `create-lcabrera-stack`, installs it from npm, and runs the same
tasks. `release.yml` runs it after a publish that created at least one tag, and
`created-tree-registry.yml` runs it on demand.

## Consequences

The pull-request gate no longer proves that the packages on npm today work
together. It proves that the next release will. The registry check covers the
gap, but only after the fact: a published combination that fails is found after
it shipped, and the fix is another release.

`workspace:verify` now builds the publishable packages before it packs, so it
takes longer than a gate that packed one unbuilt package.

The registry check runs soon after the publish. If npm has not yet served the
new versions to the runner, it tests the previous ones and can pass or fail on
them. Re-running it on demand is how to read the settled state.

## References

- [#1205](https://github.com/luciocabrera/lcabrera-stack/issues/1205), the
  issue this implements.
- [#1201](https://github.com/luciocabrera/lcabrera-stack/pull/1201), the first
  change that moved the blueprint and a package together.
