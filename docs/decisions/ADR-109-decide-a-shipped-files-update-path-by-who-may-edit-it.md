---
governs:
  - repository
---

# ADR-109 — decide a shipped file's update path by who may edit it

**Status:** Accepted

**Issue:** [#1070](https://github.com/luciocabrera/lcabrera-stack/issues/1070)

**Relates to:** [ADR-081](./ADR-081-ship-the-repo-setup-as-two-packages.md),
[ADR-073](./ADR-073-publishing-gates-check-the-packed-tarball.md)

## Context

`@lcabrera/devkit` materialises files into a consumer's tree and
`@lcabrera/repo-standards` exposes bins the consumer resolves. ADR-081 split the
two packages on that difference, and the split has held. What it never stated is
the rule for deciding which side a given file belongs on, so every new asset was
placed by judgement and every one of them landed as a seed.

A seed is never overwritten once a consumer has edited it. That is the property
ADR-081 wanted and it is right for prose. It is wrong for a gate: a consumer who
edits a materialised verifier keeps that edit through every upgrade, and the gate
then reports a pass its upstream would refuse. Nothing in the consumer's tree can
detect this, because the edited file is the thing that would have to detect it.

The profile ladder (#1073) answers a different question — which rung a file lands
on. A file needs both answers, and neither implies the other.

## Decision

**A shipped file's update path is decided by who may edit it after it arrives.**

- **Seed** — the consumer is meant to adapt it. It is materialised once, `sync`
  reports a local edit and keeps it, and divergence from upstream is the point.
- **Package** — nobody may edit it locally, because it decides pass or fail. It
  is resolved from `node_modules` and moves only by version bump.

The test that separates them: **a consumer edits this file and the edit is
wrong — who finds out?** If the answer is "nobody, and the run still goes
green", it is a package.

Two consequences of that rule are load-bearing enough to state directly.

**Path-discovered files are seeds by necessity, and necessity is not
permission.** Git finds a hook at `.git/hooks/`, GitHub finds a workflow at
`.github/workflows/`, an agent finds a skill at `.github/skills/`. Those files
have to be materialised, and what the seed may hold follows from what the finder
does with it. A path-discovered file that **runs** — a hook, a workflow — is a
seed **shell** whose body invokes a package bin, and carries no decision of its
own. A path-discovered file that is **read** — a skill, a rule, a template — is a
seed carrying its own content, because prose an agent reads is exactly what the
sorting rule hands the consumer to adapt.

**The `agent` rung takes no executables.** It places prose, and there is no
runner at that rung to invoke a bin nor a gate to fail. An asset that must run
lands at `repo` or above.

## Consequences

Moving a gate from a seed to a package takes a consumer's ability to adapt it
away, and some will want that ability — a repository with one genuinely different
rule now has to argue for it upstream or turn the gate off wholesale. That is the
trade being bought: the failure it prevents is silent, and the failure it creates
is loud.

The rule also puts a version-range problem where the seed problem used to be. A
consumer can upgrade one package and not re-run `sync`, so a seed shell can name
a bin whose behaviour has moved underneath it. ADR-081's peer range and
`devkit doctor` are what watch that; this decision makes them matter more.

The classification is recorded per file in
[`packages/devkit/CLASSIFICATION.md`](../../packages/devkit/CLASSIFICATION.md),
which is not shipped and may therefore cite records like this one.

## Alternatives considered

**Ship everything as a seed, as today.** Rejected on the failure above: an edited
gate is undetectable from inside the tree that edited it, which is the exact
class of silent pass every gate in this repository exists to close.

**Ship everything as a package, and materialise nothing.** Rejected because the
harness is prose a consumer must make theirs — their commands, their register,
their vocabulary. A package that cannot be edited is a package that is deleted.

**Decide by file type instead** — markdown is a seed, code is a package.
Rejected: it gets the hooks and the workflows wrong in opposite directions. A
hook is a shell script that must be a seed, and a register README is markdown
whose generated form is pinned by a test and must not drift.

## References

- [#1070](https://github.com/luciocabrera/lcabrera-stack/issues/1070) — the
  classification pass this rule was written for
- [#1073](https://github.com/luciocabrera/lcabrera-stack/issues/1073) — the
  profile ladder, and the settled decision that a bootstrapped repository is a
  leaf by default
- [#1064](https://github.com/luciocabrera/lcabrera-stack/issues/1064) — the epic
