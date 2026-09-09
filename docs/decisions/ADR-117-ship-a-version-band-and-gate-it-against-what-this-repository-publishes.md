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
either that package's current version or the minor after it.

It refuses a pass **per file**, not per run: a shipped file that names a package
this repository publishes and yields no declaration of it is a finding, and the
finding names the file. A whole-run refusal would not have held — one reader
going quiet while the other still answers produces a finding count above zero
and a clean exit, which is the same output a correct tree produces.

**The names are read from every shipped data file, the declarations from only
the two shapes a reader parses**, and that gap is deliberate. A declaring file
that leaves the reader's set — renamed, or a shape nobody has taught this gate —
would otherwise take its own mentions with it and go quiet with nothing left to
name it, and a second file of the same shape would keep the run looking complete.
Scanning wider than it parses is what makes the file itself the unit of refusal.
Two coarser guards sit behind it: a run that reached no manifest, or no workspace
catalog, names the shape it did not reach; and a catalog that yielded no entry at
all names itself, since a catalog is the one shape that promises entries where a
manifest may legitimately declare none.

A shipped file is a data file by its extension — JSON, JSON5, JSONC, YAML — and
prose is not scanned, so a range written in a `.md` or a `.txt` reaches a
consumer unread. That is the same boundary as the shipped `scripts/` below: a
dependency declaration nothing else would read as one is not a shape this gate
can be held to.

Comment stripping follows the file's own syntax rather than the reader's habit.
Dropping YAML's `#` comments from JSON makes the two readers disagree about the
same file, which is how a per-file refusal is switched off without any reader
going quiet.

**Only `catalog:` and `workspace:` are exempt from judgement**, because those
name a _place_ — the version is declared elsewhere and cannot fall behind here.
`npm:`, `https:` and `file:` are not that: each pins a version or an artifact, so
each is judged and refused as a shape this gate cannot read a range out of.
Exempting every protocol was tried and is a hole, not a simplification: an
`npm:` alias is a legal catalog value, so `npm:<package>@<old version>` would
otherwise ship an excluded version with the gate reporting a pass.

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

**The gate reads the shipped assets and not the shipped `scripts/`, and that
boundary was chosen rather than overlooked.** `@lcabrera/devkit` ships both, and
the rung's root manifest is written from `WORKSPACE_DEPENDENCIES` in
`packages/devkit/scripts/workspace.mjs` — so a literal range written there would
reach a created repository and this gate would not see it. Two things decide it.
A manifest and a catalog have an exact shape a reader can parse; a range inside
JavaScript has none, so covering it means guessing which string literal is a
dependency range, and a gate that guesses reports findings nobody trusts. And
the hazard already has a stricter reporter of a different kind: `workspace.mjs`
declares every dependency as `catalog:`, and `workspace.test.mjs` asserts that
none of them resolves to anything else — which forbids the literal outright
instead of judging one. If that assertion is ever relaxed, this gate's scope has
to widen with it; those two are a pair.

## References

- [#1129](https://github.com/luciocabrera/lcabrera-stack/issues/1129) — the
  shipped catalog pinned a range that excluded the next minor
- [#1076](https://github.com/luciocabrera/lcabrera-stack/issues/1076) — the same
  defect in the emitted application manifest
- [ADR-073](./ADR-073-publishing-gates-check-the-packed-tarball.md) — the other
  gate that answers for what a consumer receives rather than for this tree
