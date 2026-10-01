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
and in turn every one each of those lists under `dependencies`,
`optionalDependencies` or `peerDependencies`, and packs each from this checkout
with `pnpm pack` after `vp run packages:build`. A scratch registry
(`scripts/lib/devkit-registry-server.mjs`, a child process on `127.0.0.1`)
serves those tarballs, each as the only version of its package. The scratch
tree gets an untracked `.npmrc` that points the `@lcabrera` scope at it. The
blueprint is never touched, and nothing else in the install moves off npm.

The scratch registry answers 404 for every path that is not one of those
packuments or tarballs. That includes the npm attestation endpoint that pnpm
reads when it verifies a lockfile against its supply-chain policies. When the
registry treated that path as a tarball, the read failed and the error took the
registry process down, so every later request was refused
([#1229](https://github.com/luciocabrera/lcabrera-stack/issues/1229)). After the
tree's checks, the gate requests something from the registry. If the registry
has exited or does not answer, the first finding names it as a fault in the
gate's own registry, not in the created tree, and quotes what the registry wrote
to stderr.

The tarballs are served, not installed as `file:` specifiers or `overrides`,
because pnpm does not treat a `file:` install as a version. A peer range between
two packed packages, for example `@lcabrera/devkit`'s peer on
`@lcabrera/repo-standards`, then reads as unmet even when the packed version
satisfies it. From a registry, pnpm resolves each package to its semver version
and checks every range and peer the way it will for a consumer after the
release. An override would also have replaced the declared ranges outright.

Before the install, the gate checks the ranges itself so that a miss is named
precisely. Every declaration of a packed package must admit the packed version:
in the tree's manifests, through its catalogs, and in the other packed
manifests' `dependencies`, `optionalDependencies` and `peerDependencies`. A
packed package's `devDependencies` are left out of both the walk and this check,
because a consumer's install never reads them. After the install, it reads the
tree's lockfile. Each `@lcabrera/*` entry must carry the packed version and
integrity, and a tarball URL on the scratch registry. The URL check is needed because an unchanged
package packs byte-identical to its published tarball, so matching integrity
alone cannot tell npm and the checkout apart. A package the tree resolves that
has no workspace in this checkout fails before anything is packed.

`vp run registry-tree:verify` is the other half. It creates the tree with
the published `create-lcabrera-stack`, installs it from npm, and runs the same
tasks. `created-tree-registry.yml` runs it on demand, and `release.yml` runs it
whenever a publish reached npm. The guard is what reached npm, not whether the
job succeeded. The publish step sets its `published` output as soon as
`changeset publish` reports a tag or git has created one, and it does so before
the step can fail on a non-zero publish or on a tag count that does not match.
The registry job runs on `always()` with that output, because nothing that fails
after the upload takes a version back off npm.

An empty lockfile read is not a pass either. Every packed package must appear in
the tree's lockfile, so a lockfile the gate could not read fails rather than
reporting that nothing came from npm.

## Consequences

The pull-request gate no longer proves that the packages on npm today work
together. It proves that the next release will. The registry check covers the
gap, but only after the fact: a published combination that fails is found after
it shipped, and the fix is another release.

`workspace:verify` now builds the publishable packages before it packs, so it
takes longer than a gate that packed one unbuilt package.

`check:safe` now chains `workspace:verify`, after `tarball:verify`. It used to
be CI-only, on the grounds that a registry install on every push is a cost each
contributor would pay. That cost has not gone away: the tree still installs
everything outside `@lcabrera` from npm, builds, runs its own tasks, serves a
page and runs an upgrade. But it no longer falls on every push. The pre-push
hook runs `check:push`, which does not include this gate, and `check:safe` is
the deliberate full gate that already chains `tarball:verify`, which also
installs from npm. The gate needs network access to npm, so an offline
`check:safe` fails here.

The registry check runs the same `TREE_TASKS` as `workspace:verify`, so a task
added to that list fails the registry check until a devkit that wires the task
is published. That red run is true: a user who creates a tree from npm at that
moment gets a tree without the task. The release job that runs the check can
therefore fail after a publish that itself succeeded. Read that failure as npm
being behind the checkout, not as a failed release.

The registry check runs soon after the publish. If npm has not yet served the
new versions to the runner, it tests the previous ones and can pass or fail on
them. Re-running it on demand is how to read the settled state.

## References

- [#1205](https://github.com/luciocabrera/lcabrera-stack/issues/1205), the
  issue this implements.
- [#1201](https://github.com/luciocabrera/lcabrera-stack/pull/1201), the first
  change that moved the blueprint and a package together.
