# ADR-081 — Ship the repo setup as two installable packages

**Status:** Accepted

**Date:** 2026-08-18
**Issue:** [#716](https://github.com/luciocabrera/vite-react-compiler/issues/716)
**Relates to:** [ADR-069](./ADR-069-publish-the-shared-toolchain.md) (the
generic-core / repo-data split this follows),
[ADR-073](./ADR-073-publishing-gates-check-the-packed-tarball.md) (the gate shape
this extends from libraries to executables)

## Context

The product packages ship. The **setup that produces them** does not: the agent
skills under `.github/skills/`, the path rules under `.claude/rules/`, the
subagent definitions, the contracts under `docs/agents/`, the gate scripts under
`scripts/` and `scripts/lib/`, and the workflows under `.github/workflows/` are
all reachable only by having this checkout. A second repository starts with none
of it and either copies the directories or does without — which is what
[#672](https://github.com/luciocabrera/vite-react-compiler/issues/672) and
[#686](https://github.com/luciocabrera/vite-react-compiler/issues/686) left
behind them.

Copying is not a distribution mechanism. It has no update path: an improvement
made here never reaches the copy, and a copy edited there can never take one.
That is the whole failure this decision is written against.

ADR-069 already answered the same split once, for configuration: the factories
publish, and this repo's own data — the Oxlint workspace roster, the import
boundary tables, the tsconfig entry table — stays behind and is passed in. The
same line runs through the setup: the **procedure** is portable, the **paths and
package names inside it** are not.

Two properties of the material decide the mechanism, and they were measured
rather than assumed — the survey and its commands are recorded on #716, not
here, because a count in a doc rots and nothing checks it:

- **Most of the gate runtime is already generic.** Only a minority of the
  modules under `scripts/` and `scripts/lib/` name a repo fact
  (`vite-react-compiler`, `apps/react-router`, `@lcabrera/`, `packages/ui`,
  `luciocabrera`). This is a packaging problem, not a rewrite. Reproduce with
  `grep -rlE 'vite-react-compiler|apps/react-router|@lcabrera/|packages/ui|luciocabrera' scripts/*.mjs scripts/lib/*.mjs`.
- **The "zero-coupling" skills are not self-contained.** #716's original survey
  counted repo _names_; it did not resolve _references_. `epic` names nothing but
  requires `docs/agents/epic-orchestration.md`, `docs/coordination/README.md` and
  two files under `.claude/agents/`; `commit-and-pr` requires
  `scripts/lib/commit-convention.mjs` and both GitHub templates. Reproduce by
  resolving every markdown link and every shelled command in a skill directory
  and reporting what escapes it — the probe that becomes the gate in §Decision.

## Problem

Skills and gates look like one body of work and are delivered by two
incompatible mechanisms.

A skill is discovered by **path**: an agent reads `.github/skills/*/SKILL.md`,
and Copilot and Gemini have no skill mechanism at all — they read the files
directly, which is why `.claude/skills` is a symlink to `.github/skills` here.
Installing a package into `node_modules` puts nothing where any of them look.

A gate is invoked by **name**: `verify-pr.mjs` imports its siblings under
`scripts/lib/`, and `@repo/scan-report/deterministic-scan` is imported as a
module. Copying that into `.github/skills/` puts executable code outside node's
resolution graph — no peer checks, no dedup, one vendored copy per consumer that
no upgrade can ever reach.

Any single mechanism gets one of the two wrong.

## Options considered

1. **A template repository, or a degit-style scaffold.** Bootstraps well and has
   no update path at all — it is the copy, formalised. Rejected on the criterion
   that decides this ADR.
2. **A git submodule.** Updates, but a consumer cannot edit a skill locally
   without committing upstream or carrying a detached pin, and an agent with no
   skill mechanism still needs the files at a known path.
3. **One package, everything resolved from `node_modules`.** Rejected: it puts
   no file where a skill is discovered.
4. **One package that both materialises files and exposes bins.** Workable, and
   rejected on semver: the scanners and gates carry machine contracts that
   downstream code pins on, while skill prose changes constantly. Merging them
   makes every prose fix a version bump for contract consumers and every contract
   break a major for the package that ships a React reference.
5. **An editor-native plugin manifest** — shipping a `.claude-plugin/plugin.json`
   or the Cursor equivalent, and letting the host editor's own marketplace
   install it. Rejected as the **primary** mechanism on the second paragraph of
   §Problem: Copilot and Gemini have no skill mechanism at all and read the files
   directly, so a plugin cache serves only the agents that have one. It is not
   rejected as an _additional_ route — the two are compatible, and a consumer who
   only uses Claude Code would gain a read-only install with no drift to
   reconcile. Deferred rather than declined, on the restraint this ADR already
   applies to `@lcabrera/scan-report`: no second repository has asked. Recorded
   because it is what two of the three projects surveyed in
   [#716](https://github.com/luciocabrera/vite-react-compiler/issues/716) chose
   exclusively, and the third offers as one of two co-equal routes — so its
   absence would otherwise read as an oversight.
6. **Two packages split by delivery mechanism, plus a consumer config file.**
   `Chosen.`

## Decision

Two packages, split by **how a consumer gets the file** — not by topic.

|              | `@lcabrera/devkit`                                                                                        | `@lcabrera/repo-standards`                                                                                                                                              |
| ------------ | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Holds        | skills, `.claude/rules/`, subagent definitions, the `docs/agents/` contracts, workflow and template seeds | the gate runtime — commit convention, PR/issue/branch verification, the coordination register, the ADR registry, suppressions, docs-paths, script size, publish surface |
| Delivered by | **materialisation** — copied into `.github/`, `.claude/`, `docs/`                                         | **node resolution** — stays in `node_modules`, invoked as a bin                                                                                                         |
| Never        | imported                                                                                                  | copied                                                                                                                                                                  |
| Surface      | `devkit init`, `devkit sync`, `devkit doctor`                                                             | one bin per gate                                                                                                                                                        |

**One config file carries the repo data**, `devkit.config.json` at the consumer
root: the workspace roster, the command map (`typecheck`, `test`, `lint`, the
gate command), the GitHub owner and repository, and which gates are active. Both
packages read it and both fall back to documented defaults when it is absent.
It is one file rather than one per package because it is the consumer's data,
and two files invite drift between them. A shipped file may reference only
(a) something inside its own package, (b) a bin from a declared peer, or (c) a
key from this config. Nothing else.

**Selection is by profile, not by package**: `devkit sync --profile agent`
materialises the skills and rules only; `--profile full` adds the workflows and
templates. A consumer that wants prose and no CI is a flag, not a third npm name.

**The update path is a checksum manifest.** `sync` writes
`.devkit-manifest.json` recording the package version and a SHA-256 per
materialised file, and on re-run classifies each file into one of three states:
_unchanged_ → overwritten; _locally modified_ → kept, and reported; _new
upstream_ → added. Files the consumer wrote are unmanaged and never touched. A
reported local modification is the supported way to diverge — it is what stops a
consumer forking the kit — and `devkit doctor` is where it shows up.

**This repo becomes consumer #1.** The source of truth for every shipped file
moves into the packages, and `.github/skills/`, `.claude/rules/`,
`.claude/agents/` and `.github/workflows/` here become **materialised output**
tracked by the same manifest. `devkit doctor --check` runs in CI, so drift fails
the build. There is then exactly one copy of every shipped file, and this repo is
the canary that breaks first.

**`repo-standards` is consumed here as `workspace:*`**, so this repo always runs
source and never the published copy — a bad publish cannot brick development
here. What covers consumers instead is a packed-tarball smoke test in the ADR-073
shape, extended from "the library imports" to "every declared bin runs": pack,
install into a scratch repository that has none of this repo's files, materialise,
resolve every reference, and execute each bin.

**The three scan skills are classified not-yet-portable**, and the reason is
recorded rather than left as an omission: `linter-checker`, `fallow-code-checker`
and `code-smell-checker` are prose whose first instruction runs a scanner from
`@repo/scan-report`, which stays `@repo/*` and `private: true`. Publishing it
would be justified only by those three skills, and no second repository has asked
for them. #677 already decided that package's fate from an inventory rather than
a real consumer list and got it wrong in the other direction; this ADR declines to
repeat the guess with the sign flipped. When a second repository asks for scans,
that request decides whether the scanners publish under their own name or fold
into `repo-standards`.

## Consequences

- **Two more permanent npm names.** An npm version cannot be unpublished and a
  name cannot be reused; `@lcabrera/devkit` and `@lcabrera/repo-standards` are
  decided here and not casually renamed later. `packages/CLAUDE.md` owns the
  rename traps.
- **This repo's governance files become generated.** A hand-edit to a
  materialised skill or workflow survives until the next `devkit sync` reverts
  it — the same trap the generated tsconfigs already carry, and it fails the same
  way. The fix is the same too: change the source in the package, not the output.
- **`doctor` will report divergence forever** on any file a consumer
  deliberately edits. That is the design, not a defect to suppress.
- **Prose and the bins it invokes can skew.** A consumer can upgrade
  `repo-standards` without re-running `sync`. The compatibility is expressed as a
  peer range and checked at sync time, which is why `sync` refuses to materialise
  a skill whose declared peer is absent or out of range rather than leaving it to
  fail at run time.
- **The extraction of the gate runtime is the long pole**, and it moves gates
  this repo depends on daily. It is sequenced as independent waves by gate
  family, each leaving the repo green, rather than as one migration.
- **A shipped file may not carry a changing number.** The rule already exists
  (AGENTS.md §7); shipping to a repository where every count is wrong on arrival
  is its strongest case.

## Alternatives considered

- **Publish `@lcabrera/scan-report` alongside the two packages.** Rejected on the
  consumer list, not on the code — the package is already host-agnostic
  (`resolveHostRoot` derives the consumer root from an installed path, ingestion
  is a consumer-supplied command, fallow is an optional peer, and its report
  schema is a generic severity contract). Its only claim on publication is
  unlocking three skills nobody outside this repo has asked for. Deferred, with
  the trigger stated above.
- **Ship the skills and let each consumer supply its own gate runtime.**
  Rejected: it reproduces the failure mode #716's third acceptance criterion is
  written against — a skill whose first instruction names a command the consumer
  does not have.
- **Keep the setup here and copy it deliberately, with a documented procedure.**
  Rejected on the same ground as option 1: a documented copy is still a copy, and
  the improvement made in one repository never reaches the other.
- **Bundle the prose and the runtime into one installable unit**, the shape
  Cursor's `orchestrate` plugin uses — a skill directory carrying its own
  TypeScript CLI, installed together. Already rejected as option 4 above on
  semver grounds. The survey adds a different argument rather than evidence for
  that one: `orchestrate`'s CLI is `private: true` at `version: "0.0.0"` and has
  never been published, so it gets no dependency resolution and no version a
  consumer can pin — correctness rides on whichever copy of the directory
  happens to be installed. Option 4 predicted versions _colliding_; what
  bundling produced here is no versioning at all. Two ways to lose the same
  property, and the second is the one observed.
- **A personalisation flow that writes a consumer their own skill**, the shape of
  pstack's `automate-me`: mine the user's transcripts, then draft a routing skill
  layered over the shared base. A live counterpart to `--profile`, done
  generatively rather than by selection. Not rejected on merit — nothing in the
  adoption plan asks for it. If a later consumer needs more than `agent`/`full`,
  it is a `devkit` subcommand, not a package.

One finding runs the other way and belongs here rather than in a footnote:
**materialisation is not unprecedented among the surveyed projects.**
`mattpocock/skills` offers a copy-based route alongside its plugin one, and that
route writes editable files into the consumer's own tree — the model chosen
here. What it does not carry is any record of what it wrote, which is the half
that turns a copy into a distribution (see §Decision on the manifest).

## References

- [#716](https://github.com/luciocabrera/vite-react-compiler/issues/716) — the
  issue this decides, and the home of the surveys and their commands.
- [ADR-069](./ADR-069-publish-the-shared-toolchain.md) — the generic-core /
  repo-data split.
- [ADR-073](./ADR-073-publishing-gates-check-the-packed-tarball.md) — verifying a
  publish against the packed tarball.
- [ADR-039](./ADR-039-duplicate-over-undeclared-edges.md) — why an edge that only
  resolves in-repo is not an option.
- [`docs/coordination/README.md`](../coordination/README.md) — the register the
  `epic` and `refactor-verified` skills bind to, and one of the documents that
  must travel with them.
