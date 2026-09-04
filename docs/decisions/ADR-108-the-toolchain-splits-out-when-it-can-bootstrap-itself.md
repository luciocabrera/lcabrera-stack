---
governs:
  - repository
---

# ADR-108 — Split the toolchain out when it can bootstrap itself, and not before

**Status:** Accepted

**Date:** 2026-09-03
**Issue:** [#1067](https://github.com/luciocabrera/lcabrera-stack/issues/1067)
**Relates to:** [ADR-039](./ADR-039-duplicate-over-undeclared-edges.md),
[ADR-069](./ADR-069-publish-the-shared-toolchain.md),
[ADR-071](./ADR-071-split-the-demo-database-setup.md),
[ADR-081](./ADR-081-ship-the-repo-setup-as-two-packages.md)

## Context

Two products ship from this repository, split by who installs them: an
application stack another application installs, and a repository toolchain
another repository installs. They have different consumers, different release
triggers, and — since ADR-069 — different reasons to change.

Splitting them into separate repositories is a recurring proposal, and the case
is not weak. Blast radius: every pull request runs the whole gate suite
regardless of what changed. Self-dogfooding: a toolchain repository bootstrapped
by its own bootstrapper would prove the setup travels every time it built
itself. And the governance loop is genuinely odd — `@lcabrera/repo-standards`
governs this repository _and_ ships from it.

Left undecided, the proposal returns every few months and is re-argued from
scratch, because the fact that settles it is buried in one script's
implementation.

## Problem

`scripts/verify-devkit-seeds.mjs` reads three things **in a single checkout**:
`packages/devkit/assets` (the shipped copy), `.github/workflows` (this
repository's own), and the `apps`/`packages` rosters, from which it derives this
repository's identity. It then fails when a shipped seed names any of it — a
package name, a secret, or the task runner.

Split the repositories and that gate cannot run. The two ways to keep it are
both refused elsewhere in this repository:

- **Vendor the identity roster into the toolchain repository.** A second
  declaration of one fact, with nothing keeping the copies in step. This is the
  failure `commands:verify`, `docs:verify` and `suppressions:verify` each exist
  to catch.
- **Check out the other repository in CI.** An undeclared cross-repository edge
  that resolves only in CI — worse than the `workspace:*` edge ADR-039 refused,
  because it is neither typed nor versioned.

`devkit closure` has the same dependency: it resolves a shipped file's escapes
against the real tree.

There is a second problem the split's advocates tend to miss. **The libraries are
the toolchain's harness.** `packages/repo-standards` carries a large body of
gates whose value comes from running against a real, large, opinionated
monorepo — `docs-paths`, `stray-configs`, `shipped-docs`, `script-size`,
`inventory`, `departed-names` each need real content to be wrong about. Moved
into a repository containing only themselves, they would be exercised against a
repository containing only themselves. The odd governance loop is not a smell: it
is what continuously proves the gates against the hardest repository they will
ever meet.

## Options considered

1. **Split now, into two repositories.** Rejected: it breaks `seeds:verify` and
   `closure` on the day it happens, strands the toolchain without a harness, and
   requires hand-assembling the new repository — which is the exact task the
   bootstrapper exists to remove.
2. **Split now, into five repositories** (platform, devkit, actions, ai-runtime,
   evals, per an earlier roadmap draft). Rejected for everything in option 1,
   plus three additional boundaries with no gate behind any of them.
3. **Never split; record that.** Rejected as overreaching. The blast-radius and
   self-dogfooding arguments are real, and they become cheap to satisfy later.
4. **Defer with a stated trigger.** _Chosen._ Names the condition that flips the
   answer, so the proposal is neither re-argued nor forgotten.

## Decision

**The toolchain does not split out yet. It splits when it can bootstrap
itself — that is, when `devkit create --profile monorepo` produces a working
repository — and not before.**

The trigger is an observable event rather than an intention: the command exists,
and CI builds a repository with it. That is
[#1075](https://github.com/luciocabrera/lcabrera-stack/issues/1075) and
[#1076](https://github.com/luciocabrera/lcabrera-stack/issues/1076).

Three things are settled in advance so the split, when it happens, is execution
rather than another debate.

**Shape: two repositories, not five.** Libraries in one, harness and CLI and
bootstrapping in the other. Every additional boundary needs its own gate to
justify it, and none of the other three has one.

**`seeds:verify` is replaced, not lost — and the replacement is stronger.**
Instead of comparing the shipped copy against this tree, it bootstraps a scratch
repository and asserts the identity leak is absent _there_. That check is only
possible once the bootstrapper exists, which is a second reason the trigger is
the right one.

**Most of the split's benefit is available without it, and should be taken
first.** Moving the root gate scripts into the packages
([#1072](https://github.com/luciocabrera/lcabrera-stack/issues/1072)) obtains one
versioned unit, a clean update path and no loose files — within one repository,
breaking nothing. Independent versioning already exists via Changesets, and
per-package documentation already exists. What a split would genuinely add,
after that move, is blast radius and the self-dogfooding loop.

## Consequences

**The odd governance loop persists** for at least the length of the bootstrapper
epic, and with it the full gate suite on every pull request. That is the accepted
cost, and it is not free: CI time on unrelated changes is the most visible tax
this repository pays.

**The trigger can be gamed by accident.** "The bootstrapper works" is a
judgement about quality as much as existence, and a barely-working `create`
would technically satisfy it. Whoever proposes the split against this ADR should
be held to the gate in #1076 passing, not to the command merely existing.

**This ADR will need superseding rather than editing** when the split happens.
It is a dated record; the successor states what was done, and this one stays as
written.

**What it buys.** The proposal stops being re-argued from memory, the blocking
mechanism is named in one place a reader can check, and the work that makes the
split cheap is identified as work worth doing on its own merits.

## Alternatives considered

**Record it as a roadmap item with a target date.** Rejected: a date is a
measurement, and a measurement in a tracked file is right the day it is written
and wrong from the next commit. A trigger condition stays true as the tree moves.

**Split only `packages/devkit` and `packages/repo-standards`, leaving the
configs.** Rejected: `seeds:verify` reads devkit's assets against this
repository's workflows and rosters, so this is the same break with a smaller
blast radius, and it fragments the toolchain product that ADR-069 deliberately
assembled.

**Keep the toolchain here permanently and solve blast radius with path
filters.** Partly adopted rather than rejected — affected-only CI is worth doing
regardless (`test:changed`, `typecheck:changed` already exist). It does not
deliver the self-dogfooding loop, which is the argument for splitting that
nothing else satisfies.

## References

- [#1067](https://github.com/luciocabrera/lcabrera-stack/issues/1067) — this decision
- [#1064](https://github.com/luciocabrera/lcabrera-stack/issues/1064) — the bootstrapper epic that sets the trigger
- [#1072](https://github.com/luciocabrera/lcabrera-stack/issues/1072) — the gates-as-bins move that takes most of the benefit early
- [ADR-071](./ADR-071-split-the-demo-database-setup.md) — the worked cost of a cross-repository duplicate
- `scripts/verify-devkit-seeds.mjs` — the blocking mechanism
