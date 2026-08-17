# ADR-077 — Audit every published version, and report rather than block

**Status:** Accepted

**Date:** 2026-08-17
**Issue:** [#733](https://github.com/luciocabrera/vite-react-compiler/issues/733)
**Relates to:** [ADR-073](./ADR-073-publishing-gates-check-the-packed-tarball.md),
[ADR-043](./ADR-043-release-tooling-changesets-over-pnpm-native.md),
[ADR-057](./ADR-057-publish-the-custom-lint-rules.md)

## Context

`publish:verify` checks the tarball this repo **would** produce. It packs with
pnpm, and it must: the `publishConfig.exports` swap that turns `./src/*.ts`
targets into `./dist/*.mjs` ones is a pnpm extension, and `npm pack` ignores it
outright (ADR-073). So a defect that exists only in an `npm pack` tarball is
invisible to that gate permanently — not through an oversight in it, but by
construction.

That defect happened. `@lcabrera/eslint-plugin@0.1.0` is on npm with
`exports: {".": "./src/index.ts"}` and `dependencies: {"@typescript-eslint/utils":
"catalog:lint"}`; `npm install` of it aborts at resolution with
`EUNSUPPORTEDPROTOCOL`, before `exports` is ever read
([#730](https://github.com/luciocabrera/vite-react-compiler/issues/730)). Every
gate in this repository was green while that shipped, because none of them reads
a published manifest. `release-publish-plan.mjs` queries the registry, but only
for `dist-tags.latest`, to answer "is there anything to publish?".

`vp run release:audit` closes that: it fetches each published manifest and
asserts the shape this repo intends — no `./src/` export target in a package
this repo builds, and no `catalog:`/`workspace:` range anywhere. Two questions
about how it runs had no obvious answer, and this ADR records them.

## Problem

**Which versions to check.** An npm version is immutable. `0.1.0` can never be
repaired, only superseded — and it was, by `0.1.1`, which is `dist-tags.latest`
and installs cleanly. An audit reading only `latest` therefore reports the
package **clean** while a permanently uninstallable version sits on the registry
for anyone who pinned it.

**Whether it blocks a pull request.** Sweeping every version finds several
broken artifacts, all published before the pnpm path was in place, none of them
fixable by any change to this repository. A required check in that state fails
every pull request, including the one that would fix it — the same liveness
argument that keeps
[#698](https://github.com/luciocabrera/vite-react-compiler/issues/698) from
folding gate promotion into the work that builds a gate.

The two interact: full coverage makes a permanently-red gate possible, and a
permanently-red gate is an ignored one.

## Decision

**1. Every published version, not only `latest`.** A consumer who pinned
`@lcabrera/api@0.1.0` installs that artifact forever; `latest` being healthy says
nothing about them. The audit reports every version of every non-private
workspace package, clean ones included, so a package silently dropping out of
the sweep looks different from a package that passed.

**2. `npm deprecate` discharges a superseded finding.** A broken version cannot
be repaired, so the only remediation the registry offers is to supersede it and
deprecate it — which is consumer-visible: npm prints the deprecation message on
install. A deprecated, superseded, broken version is therefore reported as
`⚠ deprecated` and does **not** fail the audit. It stays in the output; it stops
being an alarm. This is what bounds the noise of full coverage, and it is
registry state rather than a local allowance list — the kind that
[`dependency-advisories.json`](../agents/dependency-advisories.md) exists to
keep honest and that `minimumReleaseAgeExclude` died of.

**A version any dist-tag still points at is never discharged**, deprecated or
not. Deprecation warns; it does not unpublish. `npm install <name>` still
resolves to `latest`, so a warning is all the consumer gets before the broken
artifact lands.

**3. It reports; it does not block a pull request.** The audit runs on a
schedule (`.github/workflows/release-audit.yml`), and a finding opens or updates
a single tracking issue, the way `deps-audit.yml` already handles a check whose
subject moves without anyone touching the repo. It is deliberately **not** in
`check:safe`: the registry is not a property of a pull request, the fix for a
finding needs npm credentials rather than a commit, and a schedule is also the
only thing that can catch the case this exists for — a hand-publish, which
reaches the registry without passing through CI at all.

**4. An unreachable registry fails.** The read is
`scripts/lib/registry-packument.mjs`, extracted from `release-publish-plan.mjs`
so both scripts share one set of failure semantics: a 404 is an answer ("never
published"), and anything else — an outage, a proxy, an unroutable host —
rethrows. A supply-chain check that goes green because it could not run is worse
than none, because it is believed.

## Consequences

- The audit fails today, on the artifacts #730 describes and their siblings.
  That is the gate working, and it stays red until a maintainer runs
  `npm deprecate` on each — an action needing registry credentials, out of this
  repository's reach.
- Because it reports rather than blocks, a broken publish can reach npm and stay
  there until the next scheduled run. This detects drift; it does not prevent
  it, and nothing here should be read as making the registry undriftable.
- Deprecating a version to quiet the audit is a real, public act with a
  consumer-visible effect — not a suppression in the Rule 11 sense. The version
  remains in the report either way.
- The `./src/` assertion is skipped for a package this repo does not build,
  because `@lcabrera/ui` ships source on purpose (StyleX derives theme identity
  from the source path). The classification comes from `isBuiltPublicPackage`,
  the predicate `publish:verify` already uses, so the two gates cannot disagree
  about which package is which. The cost: for a package that later switches from
  shipping source to building, the audit judges its **historical** versions by
  today's classification.
- The audit needs the **full** packument. The abbreviated `install-v1` document
  that `release-publish-plan.mjs` uses omits `exports` silently, so an audit
  reading it would find no bad target in anything and pass. That is a
  non-discriminating probe, and the shared client makes the choice explicit
  (`{ full: true }`) rather than incidental.

## Alternatives considered

- **Audit `dist-tags.latest` only.** Rejected: it reports clean on the exact
  situation that prompted this. `@lcabrera/eslint-plugin` has a healthy `latest`
  and a permanently broken `0.1.0`, and a consumer can install either.
- **Sweep every version and block pull requests on it.** Rejected: no pull
  request can fix an immutable artifact, so the gate would block every merge
  until a maintainer with npm credentials acted — #698's liveness failure, and
  the reason gate promotion is always its own deliberate step here.
- **Sweep every version with a dated allowance file for the known-broken ones.**
  Rejected: the condition never expires, so a dated allowance is a lie by
  construction, and an allowance list nobody rechecks is the failure #516
  documented. Deprecation is the same acknowledgement, recorded where consumers
  can see it and where the audit can read it back.
- **Extend `publish:verify` instead of adding a gate.** Rejected: it checks an
  artifact it built, from a tree it can see. The question here is about an
  artifact already on the registry, which may have come from a laptop.
- **List the tarball's file contents rather than reading its manifest.**
  Rejected on evidence: `npm pack` and `pnpm pack` produce byte-identical
  _files_ — substitution changes only `package.json` — so a contents check
  passes identically either way, and would have let #730 through.

## References

- Issue [#733](https://github.com/luciocabrera/vite-react-compiler/issues/733) —
  the gap and its acceptance criteria.
- Issue [#730](https://github.com/luciocabrera/vite-react-compiler/issues/730) —
  the broken publish, with the registry reads that establish it.
- [ADR-073](./ADR-073-publishing-gates-check-the-packed-tarball.md) — the
  pnpm-pack guarantee this sits beside, and the principle it extends.
- [COMMANDS.md](../../COMMANDS.md#auditing-the-published-manifests) — how to run
  it, and what it cannot do.
