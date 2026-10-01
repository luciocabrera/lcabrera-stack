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

The extension is also the limit of the paragraph above. A declaring file renamed
_within_ those extensions is still scanned and still names itself; one renamed
out of them — `package.json.tmpl`, or a name with no extension — is not, and
passes silently. That is reachable rather than theoretical: `SHIPPED_AS` in
`packages/devkit/scripts/config.mjs` already renames an asset on the way out, so
it takes one more entry pointing at a manifest or a catalog for this to bite.

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

## Amendment 2026-09-30 — a range constant `create` writes is read too

`devkit create` writes the created repository's own toolchain dependencies from
`TOOLCHAIN_RANGES` in `packages/devkit/scripts/create.mjs`, a constant rather
than an asset, so this gate never read it
([#1206](https://github.com/luciocabrera/lcabrera-stack/issues/1206)).
`create.test.mjs` already failed on a range that stopped admitting the version
its package is on. Nothing failed on a range that admits that version but not
the minor after it — a published minor would have left created repositories on
the one before.

The gate now **imports** that constant and judges each of its entries exactly
as it judges a shipped declaration, with the finding naming the file and the
constant. This does not reopen the boundary the Consequences section drew
around `scripts/`: that boundary was against guessing which string literal in
JavaScript is a range, and an imported, named value involves no guess. Two
findings are specific to a constant, because it holds only this repository's own
packages: an entry naming a package this repository does not publish is
reported rather than skipped, and a constant that yields no entry at all is
reported the way a quiet catalog is. A constant that is renamed or stops being
exported fails the run, since the gate imports it by name.

A new constant of the same kind is read only once it is listed in
`RANGE_CONSTANTS` in `scripts/lib/shipped-range-sources.mjs`; the gate does not go
looking for one. An empty list fails the run, just as a run that reached no
manifest or no workspace catalog does.

## Amendment 2026-10-01 — the floor is the version this repository publishes

The band admitted every release up to the next major, and nothing raised its
floor, so a floor written once stayed where it was while the packages moved on.
That is harmless only while the registry serves the newest version to every
install. pnpm does not: it holds back a version younger than its minimum
release age, which defaults to a day, and installs the newest older one the range
admits. A repository created the day a release shipped therefore resolved the
releases before it, and its peer check failed on a Babel peer the older pair
did not meet ([#1219](https://github.com/luciocabrera/lcabrera-stack/issues/1219)).

The band's floor is now the version this repository publishes, not a version it
once published. `vp run shipped-ranges:verify` fails on a floor below it, with
the range to write. Nobody writes it: `vp run devkit:pins` raises every floor
below the version in the checkout to that version, keeps the ceiling, and leaves
every other byte of the file alone. On a tree already in step it changes
nothing. A floor it cannot find written in the range, or a raise that would pass
the ceiling, fails the run, because the ceiling is a decision a person makes. A
range constant's entry is found by its key, so two entries that share a range
are raised separately.

`release:version` raises the floors right after the changesets move the
versions. Every raised floor sits in a file `@lcabrera/devkit` ships, so it
reaches nobody until devkit publishes. When the changesets did not move devkit,
the release writes a devkit patch changeset that names each raised floor and
versions again, so devkit publishes with them and its changelog says why
([#1226](https://github.com/luciocabrera/lcabrera-stack/issues/1226)). When no
floor moved, devkit is not versioned. Both gates read state in which this does
not show: `shipped-ranges:verify` reads the checkout, where the floor is
already right, and the registry gate installs with the delay lifted. So
`scripts/lib/release-version.test.mjs` runs the release step in a scratch
workspace and checks both outcomes.

The kit's own entry in `TOOLCHAIN_RANGES` is not raised: it is computed from the
kit's manifest when `create` runs, so whatever release of the kit creates a
repository is that repository's floor, whether or not the sync ran.

The cost is the one the minimum release age exists for. Until a release is a day
old, a repository it creates cannot install without lifting the delay, since no
version the floors admit is old enough; the initializer's README says how. The
registry gate lifts it for the same reason — it runs minutes after the publish
it checks.

The reading half of this gate, including `RANGE_CONSTANTS`, moved to
`scripts/lib/shipped-range-sources.mjs`. The raise reads it too, so the set it
raises and the set this gate judges are the same list.
