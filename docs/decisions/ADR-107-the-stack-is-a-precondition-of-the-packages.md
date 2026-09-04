---
governs:
  - repository
---

# ADR-107 — State the stack the packages require, and treat it as a precondition

**Status:** Accepted

**Date:** 2026-09-03
**Issue:** [#1065](https://github.com/luciocabrera/lcabrera-stack/issues/1065)
**Relates to:** [ADR-038](./ADR-038-public-package-topology-by-runtime.md),
[ADR-039](./ADR-039-duplicate-over-undeclared-edges.md),
[ADR-069](./ADR-069-publish-the-shared-toolchain.md),
[ADR-073](./ADR-073-publishing-gates-check-the-packed-tarball.md)

## Context

The packages that publish from this repository under `@lcabrera/*` are each held
to standing on their own: declared dependencies, a resolvable public surface, no
reliance on a consumer's tsconfig `paths`. `vp run suppressions:packages` prints
that roster. The rule is about what a package may _assume about the repository it
lands in_.

Most of it is enforced, and the shape of the exception is what this decision is
built on. `vp run publish:verify` packs every public package that builds, lays
the tarballs out as `node_modules` in a temporary directory and has a fresh Node
process import each published subpath; `attw:verify` then checks the published
types resolve for a consumer. `vp run tarball:verify` covers `devkit` and
`repo-standards`, which ship `.mjs` source and deliberately do not build.

Both gates key on a `build` script, so one package falls through both:
`@lcabrera/ui`, which publishes TypeScript source and has no build. It is packed
and imported by nothing, and it is also the package the rest of this ADR is
about. What stays uncovered for all of them is narrower and more specific:
being installed into a repository **on the declared stack** and used there.
Resolving an import is not the same as compiling StyleX in someone else's
build.

What no rule covers is what a package may assume about the **stack** it lands
on. `@lcabrera/ui` publishes TypeScript source rather than a build, so the
consumer's own toolchain compiles it, and it requires StyleX at build time.
Neither fact is written down anywhere a consumer reads before installing. The
package's own README describes components; nothing says that a repository
without StyleX, or without a TypeScript build step, cannot use it at all.

A bootstrapper is now planned ([#1064](https://github.com/luciocabrera/lcabrera-stack/issues/1064)),
and it makes the omission load-bearing rather than untidy. Bootstrapped
repositories will all be on one stack by construction, so from that point every
in-repo run and every generated consumer agrees on the toolchain — which is
precisely the condition under which an undeclared assumption stops being
observable.

## Problem

Two failures follow from leaving the stack unstated, and they run in opposite
directions.

The first is a promise nobody can keep. "The packages work standalone" reads to
a consumer as portability, and the repository neither delivers nor tests that.
Someone on Next.js and Tailwind installing `@lcabrera/ui` gets a failure with no
prior warning that they were never a supported consumer.

The second is subtler and is the one a bootstrapper introduces. Once every test
runs inside a generated repository, a package may begin depending on something
the bootstrapper wrote — an emitted Vite config, an emitted tsconfig, a catalog
entry — and every gate stays green while the standalone property quietly stops
being true. That is the same shape as the git hooks that shipped inert: a
`workspace:*` link resolved the source directory, so the packed tarball's file
modes never appeared until something installed one elsewhere
([ADR-073](./ADR-073-publishing-gates-check-the-packed-tarball.md)).

## Options considered

1. **Claim stack-neutrality and work toward it.** Rejected on what it would
   cost: `@lcabrera/ui` would have to build to `dist`, drop StyleX for a
   styling approach with no build step, or ship both. ADR-069 already declined
   to merge package pairs for less. Neutrality is not a property this repository
   wants enough to pay for, and claiming it without paying is the worse of the
   two.
2. **Say nothing, and let consumers discover the stack by failing.** The status
   quo. Rejected because it is indistinguishable from a bug: the consumer cannot
   tell an unsupported configuration from a broken package, and will file the
   second.
3. **State the stack as a precondition, and give it a mechanism.** _Chosen._
   Bounds the promise honestly, and — because the bootstrapper emits a catalog —
   pins the versions at install time rather than describing them in prose.

## Decision

**The packages require a stack, and that stack is a precondition of using them
rather than an implementation detail of building them.**

The stack is **React, React Router in framework mode, StyleX, Vite+ and pnpm**,
and this ADR is where that list lives. `docs/product/VISION.md` and the
requirements point here rather than repeating it.

No version appears in that list, deliberately. The catalog in
`pnpm-workspace.yaml` is where a version is declared, and prose repeating one is
a second declaration nothing keeps in step. That already went wrong once, when
the docs said React Router 7 while the catalog pinned 8 (#962). A version belongs
in prose only where it is a floor a reader must clear, and none of these is.

Two consequences of that statement are themselves rules.

**A package may not depend on anything the bootstrapper wrote.** This is the
existing "a package may not rely on a consumer's tsconfig `paths`" rule at the
next level up. A package may assume the stack; it may not assume the generated
repository. That distinction is what keeps both promises true at once: the
bootstrapper's, and the standalone one.

**The catalog is the mechanism.** A bootstrapped repository receives a
`pnpm-workspace.yaml` carrying the catalog, so React, React Router and StyleX are
pinned by the install rather than by a sentence. It also means the versions have
one home and the frameworks another, which is the split the rule above asks for.
A contract with no mechanism is
a sentence, and this repository has enough of those already.

The gate that enforces the invariant is
[#1081](https://github.com/luciocabrera/lcabrera-stack/issues/1081): install one
package into a scratch repository the bootstrapper did **not** create, on the
declared stack, and use it. It does not exist yet, and until it does the
invariant above is a rule held by review.

## Consequences

**What it costs.** Naming the stack forecloses a consumer base. Anyone on a
different React framework, a different styling system, or a non-Vite build is now
explicitly not a supported consumer, and that is written down where a prospective
one will read it. Some of them would have made it work; they will not try now.

**A second scratch repository to maintain.** The standalone gate needs a
hand-built tree on the declared stack that is obviously not the bootstrapper's
output, and it has to move as the stack moves. That is a real maintenance
obligation, and a stale one would pass while checking the wrong thing.

**The stack itself is now a versioned commitment.** Moving to a new React major
becomes a change to a stated precondition rather than a dependency bump, and
consumers will read it that way. This is a cost worth taking deliberately: it is
also the property that makes the statement worth anything.

**What it buys.** A consumer learns the requirement from the install rather than
from a failure. The bootstrapper has a definition of what it is bootstrapping
_onto_. And the standalone promise becomes checkable, because "standalone" now
has a stated environment to be standalone _in_ — without one, the claim has no
truth conditions and no gate could have been written for it.

## Alternatives considered

**Put the stack in each package's README instead of `VISION.md`.** Rejected: ten
copies of one fact, which is the failure mode this repository has repeatedly paid
for — `commands:verify`, `docs:verify` and `seeds:verify` all exist because a
fact was stated in more than one place and the copies drifted. A package README
may point at the statement; it may not restate it.

**Encode the stack as peer dependencies and stop there.** Peer ranges are the
right mechanism for the packages that can express it, and they are not
sufficient: they cannot say "React Router in framework mode" or "StyleX wired
into your build", which are configuration facts rather than dependency facts. Do
both — peers where expressible, and the stated precondition for the rest.

**Wait for the bootstrapper and decide then.** Rejected on ordering. The
bootstrapper's emitted catalog _is_ the mechanism, so the contract has to exist
before the thing that implements it, or the implementation defines the contract
by accident.

## References

- [#1065](https://github.com/luciocabrera/lcabrera-stack/issues/1065) — this decision
- [#1064](https://github.com/luciocabrera/lcabrera-stack/issues/1064) — the bootstrapper epic
- [#1081](https://github.com/luciocabrera/lcabrera-stack/issues/1081) — the gate that will enforce the invariant
- [ADR-073](./ADR-073-publishing-gates-check-the-packed-tarball.md) — the same reasoning one level down
- [ADR-039](./ADR-039-duplicate-over-undeclared-edges.md) — why an edge that only resolves in-repo is refused
