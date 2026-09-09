---
governs:
  - devkit
---

# ADR-117 — Ship a version band, and gate it against what this repository publishes

**Status:** Accepted

## Context

`@lcabrera/devkit` places a workspace whose `pnpm-workspace.yaml` catalogs the
`@lcabrera/*` packages a bootstrapped repository installs from the registry.
Those ranges are literals in a shipped asset, and they are the only thing
deciding which release the created repository resolves.

Every one of those packages is pre-1.0. Under semver a caret on a `0.x` version
stops at the next minor — `^0.4.1` is `>=0.4.1 <0.5.0` — so the day a minor
publishes, the shipped literal names a range that excludes it. Nothing reported
that: the asset stays syntactically valid, the create path still works, the
install still succeeds, and the created repository simply runs the release
before last. The drift was found by reading a created repository's lockfile,
not by any gate.

## Options considered

1. **Resolve the ranges when the package is packed**, from the workspace
   manifests, so the shipped asset carries no literal at all. Rejected for now:
   `devkit` has no build step, so this adds one whose only output is a rewritten
   asset in the working tree, and the emitted application manifest has the same
   need — solving one of the two with a pack step and leaving the other is worse
   than solving both the same way later (#1076).
2. **Keep the caret and add the gate alone**, so a release cannot merge while a
   shipped range is behind. Rejected as the whole answer: it makes every minor
   release a two-part change that a human has to finish, and the failure mode it
   leaves is a red gate on an unrelated release PR.
3. **Ship a band to the next major and gate it.** `Chosen.` The range admits
   every release the package makes until it breaks compatibility deliberately,
   so a repository created after a minor resolves that minor with nobody editing
   an asset; the gate is what says so out loud, and it fails on a caret rather
   than waiting for the next release to expose one.

## Decision

A dependency range in a shipped asset is written as a band from the version this
repository publishes to the next major — `>=0.5.0 <1.0.0`, not `^0.5.0`.

`vp run shipped-ranges:verify` holds it. It reads every `package.json` and
`pnpm-workspace.yaml` under `packages/devkit/assets`, keeps the declarations
naming a package this repository publishes, and fails when one of them excludes
either that package's current version or the minor after it. It also fails when
no shipped declaration matched the published roster at all, because a reader
that has stopped reading reports the same clean pass as assets that are correct.

The gate is chained into `check:safe` and `check:push`, and runs as its own step
in `check-safe.yml`.

## Consequences

A created repository picks up a minor release the day it publishes, and that is
also the cost: a `0.x` minor is allowed to break compatibility, and the band
admits it. What contains the blast radius is that a created repository writes a
lockfile at creation and never moves on its own — a break can only reach a
repository created after it shipped, never one already running.

The gate speaks about this repository's own manifests, so it says nothing about
what is actually on the registry. A version bumped here but not yet published
satisfies it. That is deliberate: reaching the registry would make the gate
fail when it cannot resolve a name, which is the shape of check that is believed
when it is merely offline.

`>=x.y.z <1.0.0` is longer than `^x.y.z` and reads as a workaround to someone
who has not hit the `0.x` caret rule. The gate's failure line says which range
to write, so the shape is discoverable from a red run rather than from prose.

## References

- [#1129](https://github.com/luciocabrera/lcabrera-stack/issues/1129) — the
  shipped catalog pinned a range that excluded the next minor
- [#1076](https://github.com/luciocabrera/lcabrera-stack/issues/1076) — the same
  defect in the emitted application manifest
- [ADR-073](./ADR-073-publishing-gates-check-the-packed-tarball.md) — the other
  gate that answers for what a consumer receives rather than for this tree
