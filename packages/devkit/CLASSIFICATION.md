# What ships, what is parameterised, and what stays

The verdict for every harness file in this repository — every skill, path rule,
subagent definition, workflow, scaffolding seed and root script — and the reason
behind each one. A later reader must be able to tell "considered and kept back"
from "not looked at", which is why nothing here is left off the table.

Three questions are answered per file, and none of them implies another:

1. **Does it ship**, and in what form — the ship verdict.
2. **Which rung** of the profile ladder it lands on.
3. **How it updates** once it has arrived — as a seed, or as code in a package.

The rosters are read from disk rather than from this file: `ls .github/skills`,
`ls .claude/rules`, `ls .claude/agents`, `ls .github/workflows`, and the
`scripts` block of the root `package.json`. A row here answering to no file is a
stale row; a file with no row has not been classified. That is the check to run
against this document, and it is the reason no count appears in it.

## How these verdicts were reached

Not by grepping for this repository's names. A file can name nothing and still
depend on plenty — `epic` mentions no repository path and cannot run without
several files outside its own directory — so the instrument is a closure probe
that resolves references instead of counting mentions:

```bash
devkit closure .github/skills/epic .claude/rules .claude/agents
```

It reports four kinds of escape, because they fail differently for a consumer:
a **link** is a file they will not have, a **command** is a tool their shell may
not resolve, an **import** is a module their install will not provide, and a
**requires** is a config key outside what `devkit.config.json` is for, so no
consumer could set it. Re-run it rather than trusting this table's age; the
verdicts are judgements, the escapes underneath them are measurements.

Two things it deliberately does not treat as a dependency: a repository name
appearing in an example, and a path that resolves nowhere. Both were false
positives in earlier hand surveys.

Every reason below is derived from the file it names. A reason that only makes
sense by reading the row above it is a defect, not a shorthand: it hides which
files were opened, and the promise at the top of this document is that a reader
can tell those apart.

The second instrument is `vp run usage:report`, which says how the harness is
actually used here. It never settles a verdict on its own — see
[Zero usage](#zero-usage) for what a zero is allowed to mean.

## Ship verdicts

| Verdict           | Meaning                                                                                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **portable**      | Ships as it stands. Its closure is empty, or the only escapes are tools every consumer has.                                                               |
| **parameterise**  | Ships once its escapes become one of the three allowed forms — a file that travels with it, a bin from a declared peer, or a key in `devkit.config.json`. |
| **repo-specific** | Does not ship. It describes something true only here.                                                                                                     |
| **blocked**       | Would ship, but its runtime is not published. Distinct from repo-specific: the verdict is about availability, not fit.                                    |

## The profile ladder

The rungs are `agent`, `repo`, `monorepo` and `full`, each strictly containing
the one below and each falsifiable by one gate (#1073). What each rung hands a
file, and may be assumed by anything placed there:

| Rung       | What is present                                                                              |
| ---------- | -------------------------------------------------------------------------------------------- |
| `agent`    | A directory of files an agent reads. No git, no code host, no manifest, no runner.           |
| `repo`     | Adds git, a code host with CI, one package manifest and a task runner. One package.          |
| `monorepo` | Adds workspaces: several packages, a catalog, task fan-out, gates that read across packages. |
| `full`     | Adds the application and its database.                                                       |

**The sorting rule: a file lands on the lowest rung whose preconditions it can
assume.** Ask what it would do with only the rung below. If it still does its
whole job, it belongs lower. A workflow needing a pnpm workspace is `monorepo`,
not `repo`; a skill needing a database is `full`.

Three corollaries, each of which decided rows below.

**Nothing executable lands on `agent`.** That rung places prose. There is no
runner to invoke a bin and no gate to fail, so a verifier starts at `repo` even
when the register it reads is placed at `agent`. The ADR template is `agent`;
`adr:verify` is `repo`.

**Publishing is a flag on `monorepo`, not a rung.** A bootstrapped repository is
a leaf by default — no changesets, no release workflow, no API-surface gate, no
`publish:verify` at any rung. That is settled on #1073 and is not re-decided
here. Release and publishing assets therefore land on no rung, and the reason
column says so rather than parking them at `full`.

**An asset bound to an external account or a hosted board is not a rung
question.** Credentials and project keys do not become available further up the
ladder, so those files do not ship at any rung.

A `—` in the profile column means the file lands on no rung. For a **blocked**
row it means the opposite of "never": the rung is recorded, and the ship verdict
carries the blocker.

## Seed or package

The second axis: how a file that ships stays current. The criterion and its two
corollaries are
[ADR-109](../../docs/decisions/ADR-109-decide-a-shipped-files-update-path-by-who-may-edit-it.md).

| Update      | Meaning                                                                                                              |
| ----------- | -------------------------------------------------------------------------------------------------------------------- |
| **seed**    | Materialised once. `sync` reports a local edit and keeps it (ADR-081). Divergence from upstream is the point.        |
| **package** | Resolved from `node_modules` and moved only by a version bump. A local edit is not merged because it is not allowed. |
| **—**       | Does not ship, so the question does not arise.                                                                       |

**The sorting rule: ask who may edit it after it arrives.** Prose a consumer is
meant to adapt is a seed. Code that decides pass or fail is a package. The test
that separates the two is a question about failure — a consumer edits this file
and the edit is wrong, who finds out? If the answer is "nobody, and the run goes
green anyway", it is a package.

**A path-discovered file is a seed by necessity, and necessity is not
permission.** Git finds a hook at `.git/hooks/`, GitHub finds a workflow at
`.github/workflows/`, an agent finds a skill at `.github/skills/`. Every one of
those is `seed` in the tables below, and every one of them is a shell whose body
invokes a package bin rather than deciding anything itself.

**A root script is a package; the manifest line that names it is a seed.** So a
task whose whole body is a tool invocation or a workspace fan-out — `format:all`,
`test:ci` — is `seed`, because the line is the whole artifact and the consumer
owns which gates their chain runs. A task naming a verifier is `package`.

## Hard and soft dependencies

A third, independent reading of the same rows. It is **not** a verdict and does
not split `parameterise`: hard-vs-soft never decides whether something ships,
only how strictly `sync` enforces it once shipped.

| Dependency | Meaning                                                                                                                            |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **hard**   | Its output is _wrong_ without the config, not merely generic — it names a file nobody named, or runs a step nobody defined.        |
| **soft**   | It degrades gracefully. Something reads as generic that could have been specific, and every instruction in it is still followable. |
| —          | Not a `parameterise` row, so the question does not arise: it either needs no config at all, or does not ship.                      |

A **hard** row is the one that earns a `requires:` declaration in its
frontmatter, which is what makes `sync` refuse to write it into a consumer who
cannot satisfy it. Adding those declarations is each skill's own
parameterisation, not this table's job — the table says which rows will need one.

## What a shipped file may not contain

A verdict answers whether something _fits_ a consumer. This answers what it may
say once it does, and it is the constraint the `parameterise` reasons above keep
invoking.

**A shipped file may not cite a record internal to building this toolchain.** No
ADR number, no issue or pull request number, no `docs/decisions/` or
`docs/product/` path, no link into this repository's history. A bootstrapped
project has none of those records and never will. It writes its own, which is why
the ADR and coordination registers ship as an empty template plus a README rather
than as this repository's contents.

The distinction is between a register and its entries. The register scaffolding
travels. The entries are this repository's reasoning about its own construction,
and to a consumer they are dead links wearing the authority of a citation.

This document is not one of those files. It is excluded from the package's
`files` list, stays in the source repository, and therefore cites ADRs and issue
numbers freely.

Half of the rule is gated and half is not, and the split is worth knowing before
trusting a green run. `devkit closure` catches a citation written as a **link**,
because the target resolves outside the shipped set. It does not catch a citation
written as **prose**: "the hierarchy decided in ADR-054" and "the rationale in
#962" have no path to resolve, so nothing looks at them. `seeds:verify` catches
neither, because it forbids a seed naming this repository's identity — its slug,
owner, workspaces, secrets and task runner — and a record number is none of
those.

So an unlinked citation reports exactly the clean pass a file citing nothing
reports. That is the half held by review, and it is the half a writer reaches for
naturally, because prose citations read better than links.

## Skills

Every skill is prose an agent reads at a discovered path, so every row is
`seed`. The executable half a skill drives — a convention spec, a report
producer — is classified with the root scripts below.

| Skill                         | Profile | Update | Verdict           | Dependency | Reason                                                                                                                                                                                                                                                                                                                                                 |
| ----------------------------- | ------- | ------ | ----------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `codebase-explorer`           | `agent` | seed   | **portable**      | —          | Closure is empty. Investigation procedure with no repository in it, and no runner behind it.                                                                                                                                                                                                                                                           |
| `react-19`                    | `agent` | seed   | **portable**      | —          | Closure is empty. React 19 and compiler patterns, framework-level throughout. Prose only, so it needs no rung above `agent` even though React arrives at `full`.                                                                                                                                                                                       |
| `react-router-framework-mode` | `agent` | seed   | **portable**      | —          | Closure is empty, and nothing in it names this repository — the reference material is React Router's own documentation. It carried one example citing this repo's app manifest until that example was generalised.                                                                                                                                     |
| `store-pattern`               | `agent` | seed   | **parameterise**  | **soft**   | The pattern is general and reads as prose. Its references point into the live Table implementation, so those become excerpts that travel or generic examples — a consumer has no `packages/ui`.                                                                                                                                                        |
| `typescript-api-engineering`  | `agent` | seed   | **parameterise**  | **soft**   | Already split into a generic half and a project half — the shape everything else is being moved toward. The generic half ships; the project half stays.                                                                                                                                                                                                |
| `unslop`                      | `agent` | seed   | **parameterise**  | **hard**   | The three levels and the calibration procedure are general. Its voice files are not: `repo-voice.md` is derived from this repository's own prose, and `style-profile.md` quotes the maintainer directly and must never ship. Step 1 mandates reading a voice file, so a consumer needs one generated from theirs before the skill runs at all.         |
| `product-requirement`         | `agent` | seed   | **parameterise**  | **hard**   | The register discipline travels: one file per requirement, a declared state, acceptance a machine can decide. The register it drives does not. A consumer has no `docs/product/`, so the README, the vision page and the requirement template ship as seeds the way the ADR and coordination registers do, and the named examples become generic ones. |
| `epic`                        | `repo`  | seed   | **parameterise**  | **hard**   | Drives issues, branches and pull requests, so it assumes a code host. Needs its orchestration contract, the coordination README and both subagent definitions — all of which ship with it. Its reference to the root agent document becomes a config key, since a consumer's is named by them.                                                         |
| `refactor-verified`           | `repo`  | seed   | **parameterise**  | **soft**   | Reads an issue, branches, and opens and edits a pull request, so it assumes a code host. Two contract documents travel with it, and it dispatches `commit-and-pr` and `quality-gate-workflow`, which ship alongside.                                                                                                                                   |
| `commit-and-pr`               | `repo`  | seed   | **parameterise**  | **hard**   | Commits, branches and pull requests are `repo`-rung facts. The convention it enforces is executable and lives in the gate runtime; the PR and issue templates it checks against ship as seeds. Until both land it materialises but cannot run.                                                                                                         |
| `quality-gate-workflow`       | `repo`  | seed   | **parameterise**  | **hard**   | The stage order is portable and every stage names a task through the command map, which a single-package repository can answer. Its React Doctor and Biome references are this repo's analysers and drop out.                                                                                                                                          |
| `health-swarm`                | `repo`  | seed   | **parameterise**  | **hard**   | The scout charters are general and scan a tree, not a workspace. The traps, report locations and helper scripts they cite are this repository's. The heaviest of the parameterise set, and worth doing after the lighter ones prove the config surface.                                                                                                |
| `lint-toolchain`              | —       | —      | **repo-specific** | —          | It documents _this_ repository's analyser topology: which of four engines owns which rule, the suppressions register, the Sonar wiring. Useful to read, false everywhere else.                                                                                                                                                                         |
| `releasing`                   | —       | —      | **repo-specific** | —          | The Changesets flow, the publish gates and the label taxonomy of the `@lcabrera/*` packages specifically. Independently off the ladder: publishing is a flag on `monorepo`, not a rung.                                                                                                                                                                |
| `linter-checker`              | `repo`  | seed   | **blocked**       | —          | Runs `vp run lint:report`, a root repository task. Ships at `repo` the day that task has a home a consumer can install.                                                                                                                                                                                                                                |
| `fallow-code-checker`         | `repo`  | seed   | **blocked**       | —          | Runs `vp run fallow:report` and reads the root `.fallowrc.json`; also coverage-merge from the repository root. The analyser itself works on one package, so the rung is `repo`, not `monorepo`.                                                                                                                                                        |
| `code-smell-checker`          | `repo`  | seed   | **parameterise**  | **soft**   | Names no task and runs nothing. Every escape is a link into `code-smell-shared/`, which ships alongside — the same shape as `refactor-verified`, and the reason the row is not `portable`. `repo` rather than `agent` because it scopes to a pull request's changed files and reads lint, type-check and test signals.                                 |
| `code-smell-zen`              | `repo`  | seed   | **parameterise**  | **soft**   | Step 1 runs a script that ships in its own `scripts/`, and that script needs git and a base branch — which is what puts the row at `repo`. Its other escapes are the same links into `code-smell-shared/`.                                                                                                                                             |
| `code-smell-shared`           | `repo`  | seed   | **parameterise**  | **soft**   | The report contract the two `code-smell` skills read; it ships if and when they do. Its README cites an ADR and its quick reference names this repository's task runner in a verification cell, and both drop to generic prose. It carries no `SKILL.md` and is an allowlisted support directory, which is why no usage measurement names it.          |

Reading the **hard** rows: `epic` names the consumer's root agent document
through config, so without it an orchestrator is told to read a file nobody
named. `commit-and-pr` and `quality-gate-workflow` each drive the toolchain, and
a gate procedure whose stages resolve to nothing reports a clean pass that means
nothing. `health-swarm`'s scouts write to report locations that come from config;
unset, a scout produces its findings nowhere. Every **soft** row loses
specificity and keeps every instruction followable.

The blocked rows are one decision, not one per row: `linter-checker` and
`fallow-code-checker` each open by running a task defined in this repository's
root manifest, which a consumer installing the skill would not have. The
root-script table below records where `lint:report` and `fallow:report` land,
which is what discharging the blocker costs.

The `code-smell` rows carried that verdict too, and the closure probe took it off
them. ADR-081 blocked them alongside the analyser skills, on a private scanner
runtime; [ADR-091](../../docs/decisions/ADR-091-retire-the-scan-report-pipeline.md)
retired it and moved the report contract in beside the skills. That left the
analyser skills standing on root tasks and left the `code-smell` skills naming no
task at all — `code-smell-zen` runs a script from its own `scripts/`,
`code-smell-checker` runs nothing — while the rows kept the old reason. Re-run
the probe over them rather than trusting this paragraph's age.

## Path rules

Every path rule is prose loaded by glob from `.claude/rules/`, so every row is
`seed`. Nothing invokes a rule; where one names a command, that command is an
escape the row accounts for.

| Rule                   | Profile    | Update | Verdict          | Dependency | Reason                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------------------- | ---------- | ------ | ---------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `routes-data.md`       | `agent`    | seed   | **portable**     | —          | Loader/action data flow, framework-level. Portable since #860 rewrote its examples to name the concept; before that its closure was empty and it was still not portable.                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `typescript.md`        | `agent`    | seed   | **parameterise** | **soft**   | The standards are general. What escapes is this repository's: its ADR citations, the benchmark script behind one of them, the generated-tsconfig entries file, the route-artifact helper, and the UI package's `PATTERNS.md`.                                                                                                                                                                                                                                                                                                                                                                            |
| `testing.md`           | `agent`    | seed   | **parameterise** | **hard**   | General except its escapes, all this repository's: the toolchain import convention, which is an ADR here and a config key in a consumer; a named mock-store helper in the UI package; and that package's `INVENTORY.md`.                                                                                                                                                                                                                                                                                                                                                                                 |
| `react-components.md`  | `agent`    | seed   | **parameterise** | **soft**   | The component conventions travel. The inventory paths and the `PATTERNS.md` it points at are per-repository and belong in config, and it cites an ADR that does not ship.                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `scripts.md`           | `agent`    | seed   | **parameterise** | **soft**   | The structure, purity and size standards are general. The exemplar script it names and the size baseline it points at are this repository's, and the gate enforcing the ceiling moves to the gate runtime package.                                                                                                                                                                                                                                                                                                                                                                                       |
| `package-rationale.md` | `monorepo` | seed   | **parameterise** | **soft**   | Its globs are `packages/**`, `.changeset/**` and `docs/decisions/**`. The first needs workspaces and the second a changeset flow, which is the publishing flag on `monorepo`. The third resolves as low as `agent`, where the decision seeds land, but the rule binds a record only where it justifies a published package, and below that flag there is none. The rule itself — a package's rationale in the package's own vocabulary — holds anywhere; the scope name, the suppressions command, the ADR citation, the abstraction guide it links and `package-refs:verify` drop out or become config. |

`testing.md` is the hard row: its import convention names the module tests must
import from, so a consumer without that key is left with a rule instructing them
to import from nowhere. The **soft** rows lose a citation or a pointer.

`package-rationale.md` is the row this pass added, and it is worth saying why it
was missing rather than only that it now exists: the earlier pass enumerated the
rules by hand, and a rule added afterwards joined no table. That is the failure
the disk-read instruction at the top of this document exists to prevent.

`routes-data.md` is worth reading as a warning about the instrument. It earned
**portable** on an empty closure, and an empty closure is a true answer to the
wrong question: the probe resolves links, fenced commands and inline paths, and
a package name written in prose is none of the three. The rule named this
repository's UI and server packages in four sentences and read clean anyway
(#860). A verdict of portable now needs the seed gate to agree, since that one
reads words rather than structure.

## Subagent definitions

Discovered by path from `.claude/agents/`, so every row is `seed`.

| Definition           | Profile | Update | Verdict          | Dependency | Reason                                                                                                                                                                                                                                                                 |
| -------------------- | ------- | ------ | ---------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `architecture-guard` | `agent` | seed   | **parameterise** | **hard**   | Reads inventories and architecture documents and writes a finding. Its tool grant is `Read`, `Glob` and `Grep`, so the one command its prose names is one it cannot run — `agent` carries it, and the paths it reads are config.                                       |
| `refactor-builder`   | `repo`  | seed   | **parameterise** | **hard**   | Claims work, branches and pushes, so it assumes a code host. Its remaining escapes are toolchain commands the command map answers, plus the `package-rationale` rule, which ships with the path rules.                                                                 |
| `refactor-verifier`  | `repo`  | seed   | **parameterise** | **hard**   | Reads a pull request and posts its findings back, and reverts a planted violation with git — a code host, and nothing above it. It never commits or pushes. It certifies against two contract documents and the `package-rationale` rule, all of which ship alongside. |
| `quality-gate`       | `repo`  | seed   | **parameterise** | **hard**   | Its own text sends it to `quality-gate-workflow/SKILL.md` for the stage order, so it needs whatever that skill needs and moves when it does.                                                                                                                           |
| `fallow-scan`        | `repo`  | seed   | **blocked**      | —          | Its own text sends it to `fallow-code-checker/SKILL.md`, whose first instruction runs the task that skill is blocked on. Same rung for the same reason.                                                                                                                |

Every **parameterise** row here is hard, and for one reason: a subagent
definition is executed, not read. Its commands and the paths it reads are its
whole input, so an unanswered one leaves an agent that runs and reports without
having examined anything — which reads exactly like a pass.

## Workflows

Every workflow is discovered by path from `.github/workflows/`, so every shipping
row is `seed` — a shell whose steps invoke the gate runtime's bins, the
consumer's command map, or nothing but the bootstrap those two need. None of them
may carry a decision of its own.

Rows are named by the file in this repository. Where a seed exists under a
different name, the reason says so.

| Workflow                    | Profile | Update | Reason                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------------- | ------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pr-standards.yml`          | `repo`  | seed   | The procedure is the gate runtime's; the install step is the consumer's. Refused outright without `commands.install`, since a workflow that cannot install cannot check anything.                                                                                                                                                                                               |
| `issue-standards.yml`       | `repo`  | seed   | One step — `repo-verify-issue` over the issue body the event carries — and the consumer's install before it.                                                                                                                                                                                                                                                                    |
| `coordination-close.yml`    | `repo`  | seed   | Deletes the task file a merged pull request claimed. The register's location comes from the runtime's own config, so the workflow never repeats it.                                                                                                                                                                                                                             |
| `deps-audit.yml`            | `repo`  | seed   | Ships as `workflows/dependency-audit.yml`. The audit command is the consumer's; filing the finding as an issue against the seeded template is not.                                                                                                                                                                                                                              |
| `check-safe.yml`            | `repo`  | seed   | Ships as `workflows/check.yml` — format, lint, types and tests from the command map, registers and decisions from the runtime. The rest of this file is this repository's own gate and stays.                                                                                                                                                                                   |
| `add-to-project.yml`        | —       | —      | Adds an issue to this repository's planning board, named by a repository variable and reached with a personal access token.                                                                                                                                                                                                                                                     |
| `project-status.yml`        | —       | —      | Moves the cards on that board's Status column. The owner and the board number are written into the file, and the token is the same one.                                                                                                                                                                                                                                         |
| `labeler.yml`               | —       | —      | Applies labels computed from `scripts/lib/labels.mjs`, this repository's taxonomy, after re-syncing it.                                                                                                                                                                                                                                                                         |
| `sync-labels.yml`           | —       | —      | Writes that same taxonomy file back to the code host, and triggers on the manifests it is derived from.                                                                                                                                                                                                                                                                         |
| `claude-review.yml`         | —       | —      | Runs a hosted reviewer under `CLAUDE_CODE_OAUTH_TOKEN` and a reviewer app's key. Credentials do not arrive further up the ladder, and a job that skips every step without them reports success to a consumer who has nothing working.                                                                                                                                           |
| `copilot-review-gate.yml`   | —       | —      | Publishes a status that is green only while a named review bot's newest review matches the head. It needs no secret — what does not travel is the accepted-reviewer roster in `scripts/lib/copilot-review.mjs` and the ruleset that requires the status.                                                                                                                        |
| `copilot-setup-steps.yml`   | `repo`  | seed   | Provisions a coding agent's container: checkout, toolchain setup, install, and nothing else. It holds no secret and gates nothing, so its whole body is the bootstrap `check.yml` already parameterises. The job name is the code host's contract with that agent and is not a consumer's to choose.                                                                            |
| `agent-review-verdict.yml`  | —       | —      | Validates a posted verdict against `docs/agents/agent-review-contract.md`, which does not ship. The automatic token is all it needs, so the contract is what keeps it here, not a credential.                                                                                                                                                                                   |
| `review-gate-reconcile.yml` | —       | —      | Republishes the statuses the two gates above own, and files its own failures as an issue against this repository's label taxonomy. It holds no secret either; it cannot travel further than they do.                                                                                                                                                                            |
| `sonar-issue-gate.yml`      | —       | —      | Bound to an external account and its project key. A seed carrying it is a workflow that fails on its first run.                                                                                                                                                                                                                                                                 |
| `lighthouse.yml`            | —       | —      | Path-scoped to the example application and built around it: that app's build, its serve entry and port, its report directory, and the threshold config and score checker that live inside it. It needs no credential and no deployment — it serves the build itself — but nothing in it is a gate-runtime bin, and removing the application's own audit leaves nothing to seed. |
| `secret-scan.yml`           | —       | —      | Configured against this repository's scanner and its allowlist.                                                                                                                                                                                                                                                                                                                 |
| `validate-skills.yml`       | —       | —      | Checks the skills **this** repository authors, against its own layout. A consumer's skills are the ones it materialised, and the manifest already reports those.                                                                                                                                                                                                                |
| `release.yml`               | —       | —      | Publishing is a flag on `monorepo`, not a rung, and a bootstrapped repository is a leaf by default (#1073).                                                                                                                                                                                                                                                                     |
| `release-audit.yml`         | —       | —      | Audits daily what the registry actually serves and files the drift as an issue. Publishing is a flag, so there is no published manifest to audit.                                                                                                                                                                                                                               |
| `changelog.yml`             | —       | —      | Its only trigger is a pushed `v*` tag, and it turns that tag's commit range into release notes. A leaf repository has no release flow to tag.                                                                                                                                                                                                                                   |

## Scaffolding seeds

The gates a consumer installs are only half of what makes them run. The hooks
that run them before a push, the templates they check against and the registers
they read are path-discovered exactly like a skill, so they use the same
mechanism and the same manifest.

| Seed                                                        | Profile | Update | Verdict          | Dependency | Reason                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------- | ------- | ------ | ---------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `coordination/README.md`, `coordination/tasks/_TEMPLATE.md` | `agent` | seed   | **portable**     | —          | The claim protocol and the task schema, with this repository's board, its one-step claim command and its decision citations removed. On `agent` rather than `repo`: the skills bind to it, and reading it needs nothing.                                                                                                  |
| `decisions/_TEMPLATE.md`                                    | `agent` | seed   | **portable**     | —          | The record shape. The numbering rule travels; the taxonomy citation does not.                                                                                                                                                                                                                                             |
| `decisions/README.md`                                       | `agent` | seed   | **portable**     | —          | Generated, not authored: byte-identical to what the ADR gate renders for a default home, pinned by `scripts/lib/devkit-seeds.test.mjs` — which lives outside both packages because neither may depend on the other. Without it a fresh home fails its own gate; without the test it would drift into failing it silently. |
| `templates/pull_request_template.md`                        | `repo`  | seed   | **portable**     | —          | The sections are the gate runtime's, and it names the allowed types itself when it rejects one. `repo`, because nothing reads it until there is a code host.                                                                                                                                                              |
| `templates/ISSUE_TEMPLATE/standard_issue.md`                | `repo`  | seed   | **portable**     | —          | The sections `repo-verify-issue` requires, and nothing this repository owns. `repo`, because nothing reads it until there is a code host.                                                                                                                                                                                 |
| `hooks/commit-msg`, `hooks/pre-push`                        | `repo`  | seed   | **parameterise** | **hard**   | Git discovers a hook by path, so the file must be materialised — and its body is nothing but an invocation of the runtime's bins plus the consumer's `check`/`test`. They arrive **executable**: a hook without the bit is skipped by git without a word, which reads like a hook that passed.                            |
| `root/COMMANDS.md`                                          | `repo`  | seed   | **portable**     | —          | Lists only what the two packages provide, and the config keys a consumer supplies. `repo`, because every command in it needs a runner.                                                                                                                                                                                    |

## Root scripts

Read the roster from the `scripts` block of the root `package.json`, not from
here. Every row that ships is `package` unless its whole body is a tool
invocation or a workspace fan-out, in which case the manifest line is the entire
artifact and the consumer owns it — those rows are `seed`.

### Already resolved from a package

These are `@lcabrera/repo-standards` bins today, so the update path is settled
and only the rung is a judgement.

| Task                      | Profile | Update  | Reason                                                                                                                   |
| ------------------------- | ------- | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| `adr:new`                 | `repo`  | package | Scaffolds into the seeded ADR home. The template is `agent`; running a bin is not.                                       |
| `adr:list`                | `repo`  | package | Prints every record in that same home.                                                                                   |
| `adr:verify`              | `repo`  | package | Gates placement, numbering and required sections.                                                                        |
| `branch:verify`           | `repo`  | package | Branch naming, which needs git and nothing above it.                                                                     |
| `commit:verify`           | `repo`  | package | The one commit-convention spec.                                                                                          |
| `issue:verify`            | `repo`  | package | Issue template sections, against a code host.                                                                            |
| `pr:verify`               | `repo`  | package | Pull request template sections.                                                                                          |
| `coordination:verify`     | `repo`  | package | Register integrity, read across live branches.                                                                           |
| `coordination:board`      | `repo`  | package | The local board view over the coordination register.                                                                     |
| `coordination:board:live` | `repo`  | package | The same board rendered from the code host's open pull requests, through a second bin.                                   |
| `coordination:close`      | `repo`  | package | Deletes the claim a merge closed.                                                                                        |
| `docs:verify`             | `repo`  | package | Resolves the repository paths documents name.                                                                            |
| `configs:verify`          | `repo`  | package | Fails a formatter or linter config no engine reads. Needs the engine topology, which arrives with the runner at `repo`.  |
| `scripts:verify`          | `repo`  | package | The script-size ceiling over a source tree.                                                                              |
| `api-surface:verify`      | —       | —       | Publishing is a flag, not a rung (#1073).                                                                                |
| `attw:verify`             | —       | —       | Checks how a published package's types resolve for an installer. Nothing is published, so nothing resolves wrongly.      |
| `publish:verify`          | —       | —       | Checks the tarball the source tree would pack before it can reach a registry. There is no tarball to pack.               |
| `shipped-docs:verify`     | —       | —       | Checks that a published package's documents are self-contained. Without publishing there is no shipped document to read. |
| `release:plan`            | —       | —       | Release machinery; a leaf repository has none.                                                                           |
| `release:audit`           | —       | —       | Compares the manifests on the registry against what the tree intends. Nothing here is on a registry.                     |

### The devkit bins and the gate chains

| Task             | Profile | Update  | Reason                                                                                                                                     |
| ---------------- | ------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `devkit:sync`    | `agent` | package | The materialiser itself, and the only executable that has to work before any rung exists. It is run from the package, never from the tree. |
| `devkit:doctor`  | `repo`  | package | Reports what the materialised copies have diverged into.                                                                                   |
| `devkit:check`   | `repo`  | package | The same read as a gate, which needs somewhere to fail.                                                                                    |
| `devkit:closure` | `repo`  | package | The closure probe behind this document.                                                                                                    |
| `check:safe`     | `repo`  | seed    | A chain of the consumer's own task names. Which gates belong in it is theirs, so it is a seeded manifest line and grows with the rung.     |
| `check:push`     | `repo`  | seed    | The same chain with the slow tail dropped, so a pre-push hook can afford it. Where the cut falls is the consumer's.                        |
| `ready`          | `repo`  | seed    | `check:safe` followed by a build, composed in the manifest.                                                                                |

`devkit:sync` is the one exception to "nothing executable lands on `agent`", and
it is not really an exception: it runs from the package that is placing the rung,
not from inside the rung it placed.

### Gates and tools that ship

| Task                    | Profile    | Update  | Reason                                                                                                                                                              |
| ----------------------- | ---------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `commands:verify`       | `repo`     | package | Keeps a command document honest against what the runner reports. `root/COMMANDS.md` already ships, and an unchecked command document is the rot it was written for. |
| `coordination:claim`    | `repo`     | package | Scaffolds the task, branches, commits and opens the draft pull request. The safe path stays the easy one only if it is one command.                                 |
| `deps:audit`            | `repo`     | package | Fails on an advisory at moderate or above, reading the allowance register. The register is a seed; the gate is not.                                                 |
| `departed:verify`       | `repo`     | package | Fails when anything names a departed product or workspace. The roster in `scripts/departed-names.json` is the consumer's; the gate is not.                          |
| `renames:verify`        | `repo`     | package | Fails a rename that left a document naming the old file.                                                                                                            |
| `registers:verify`      | `repo`     | package | Gates the requirement and planning registers the `product-requirement` skill drives.                                                                                |
| `product:distance`      | `repo`     | package | Reads the same register and prints how far the product is from its intent. Ships with the skill that fills it.                                                      |
| `scripts:exits:verify`  | `repo`     | package | No script calls `process.exit()` (ADR-090). A rule from `scripts.md`, which ships.                                                                                  |
| `lint:eslint:verify`    | `repo`     | package | Proves the eslint pass ran its rules rather than dying on one — a pass that checks nothing exits the same way as a pass that found something.                       |
| `viteplus:verify`       | `repo`     | package | Keeps the runner's managed block from refilling the agent document with guidance that contradicts it.                                                               |
| `worktree:env`          | `repo`     | package | Links the gitignored env files into a linked worktree, so a fresh one does not run with the env silently unloaded.                                                  |
| `pr:threads`            | `repo`     | package | Lists and resolves the review threads holding a pull request. The code host's CLI has no command for it.                                                            |
| `review-threads:verify` | `repo`     | package | Publishes the open-thread count as a commit status, so a silent block becomes a red check.                                                                          |
| `housekeeping:prune`    | `repo`     | package | Deletes merged branches and clean worktrees, and only reports anything that might be real work.                                                                     |
| `usage:report`          | `repo`     | package | Reports how the harness is used. The harness is placed at `agent`, but the report reads git and the code host.                                                      |
| `lint:report`           | `repo`     | package | The report producer `linter-checker` is blocked on. Which engines run comes from the command map.                                                                   |
| `fallow:report`         | `repo`     | package | The fixed invocation `fallow-code-checker` and `fallow-scan` are blocked on. Shipping it and `lint:report` is what discharges those verdicts.                       |
| `test:changed`          | `monorepo` | package | Resolves the workspaces a diff touched plus their dependents. Nothing to resolve with one package.                                                                  |
| `typecheck:changed`     | `monorepo` | package | The same affected-set runner for a uniform per-workspace task.                                                                                                      |
| `coverage:merge`        | `monorepo` | package | Merges the per-workspace Istanbul reports into the one file the audit consumes.                                                                                     |
| `coverage:report`       | `monorepo` | package | Builds the per-workspace summary the coverage comment renders.                                                                                                      |
| `docs:for-package`      | `monorepo` | package | Lists the documents that declare a workspace, by reading the registers rather than grepping.                                                                        |
| `inventory:verify`      | `monorepo` | package | Fails a util export named in no `INVENTORY.md`. One package has no inventory discipline to gate.                                                                    |
| `lint:plugins:verify`   | `monorepo` | package | Proves every plugin family loaded and every workspace is classified exactly once — the second half needs workspaces.                                                |
| `package-refs:verify`   | `monorepo` | package | Fails a package whose shipped text names an app. Needs both to exist.                                                                                               |
| `deps:refresh`          | `monorepo` | package | Moves the catalog, the pinned package manager and the node version in one pass. The catalog is a workspace artifact.                                                |
| `react-doctor:verify`   | `full`     | package | Gates React Doctor's error findings, and there is no React source below `full`.                                                                                     |
| `react-doctor:report`   | `full`     | package | The same run, reporting rather than gating.                                                                                                                         |
| `route-names:verify`    | `full`     | package | Names a route folder's artifacts against what the folder holds. Needs the router and its routes.                                                                    |

### Manifest lines the consumer owns

Their whole body is a tool invocation or a fan-out, so the line is the artifact.

| Task               | Profile    | Update | Reason                                                                                             |
| ------------------ | ---------- | ------ | -------------------------------------------------------------------------------------------------- |
| `prepare`          | `repo`     | seed   | The runner's own install hook.                                                                     |
| `format:all`       | `repo`     | seed   | One formatter invocation.                                                                          |
| `lint:all`         | `repo`     | seed   | A chain of the consumer's lint tasks.                                                              |
| `lint:biome`       | `repo`     | seed   | One analyser invocation; which analysers a consumer runs is theirs.                                |
| `lint:biome:check` | `repo`     | seed   | The same analyser without `--write` — the form a gate runs.                                        |
| `test:scripts`     | `repo`     | seed   | Runs the suites that live in no workspace.                                                         |
| `fallow:full`      | `repo`     | seed   | One analyser invocation, configured by a seeded config file.                                       |
| `fallow:audit`     | `repo`     | seed   | Its `audit` subcommand.                                                                            |
| `fallow:dead-code` | `repo`     | seed   | Its `dead-code` subcommand.                                                                        |
| `fallow:dupes`     | `repo`     | seed   | Its `dupes` subcommand.                                                                            |
| `fallow:health`    | `repo`     | seed   | Its `health` subcommand, plus the flags to print with it — the line is the artifact.               |
| `build:all`        | `monorepo` | seed   | Fan-out in dependency order.                                                                       |
| `typecheck:all`    | `monorepo` | seed   | Fan-out.                                                                                           |
| `typegen:all`      | `monorepo` | seed   | Fan-out.                                                                                           |
| `test:all`         | `monorepo` | seed   | Fan-out plus the root script suites.                                                               |
| `test:ci`          | `monorepo` | seed   | The same fan-out ordered so the coverage summary is the fresh one. The ordering is the consumer's. |
| `packages:build`   | `monorepo` | seed   | Fan-out over the package workspaces.                                                               |
| `dev:showcase`     | `full`     | seed   | Starts the example application. The line ships; the application's name is the consumer's.          |
| `start:showcase`   | `full`     | seed   | Runs that application in production mode.                                                          |
| `db:up`            | `full`     | seed   | The database lane. Image, ports and env file are the consumer's.                                   |
| `db:down`          | `full`     | seed   | Stops it, through the same compose file.                                                           |
| `db:status`        | `full`     | seed   | Reports what that compose file has running.                                                        |

### Root scripts that do not ship

| Task                        | Profile | Update | Reason                                                                                                                                       |
| --------------------------- | ------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `agent-review:verify`       | —       | —      | Validates a verdict against this repository's agent-review contract, and needs the review integration that produces one.                     |
| `copilot-review:status`     | —       | —      | Computes the status the review gate publishes, against a roster of accepted reviewers written into `scripts/lib/copilot-review.mjs`.         |
| `copilot-review:suppressed` | —       | —      | Parses the findings that same reviewer puts in a review body instead of a thread. It reads one reviewer's output format.                     |
| `review-gates:reconcile`    | —       | —      | Republishes the statuses those gates own.                                                                                                    |
| `sonar:report`              | —       | —      | An external account and its project key; there is no scanner in this tree to point elsewhere.                                                |
| `sonar:verify`              | —       | —      | The same script under `--gate`, so it fails a build instead of printing. It reads the same external account.                                 |
| `labels:sync`               | —       | —      | This repository's label taxonomy.                                                                                                            |
| `plan:issues`               | —       | —      | Checks a backlog against this repository's label taxonomy, milestones and issue template.                                                    |
| `pr:queue`                  | —       | —      | Acts on open pull requests against this repository's merge policy and its review gates. The policy is prose; the gates it reads do not ship. |
| `skills:validate`           | —       | —      | Checks the skills **this** repository authors. A consumer's are the ones it materialised, and the manifest already reports those.            |
| `skills:report`             | —       | —      | The reporting half of the same check.                                                                                                        |
| `seeds:verify`              | —       | —      | Checks what `packages/devkit` ships. A consumer ships nothing.                                                                               |
| `tarball:verify`            | —       | —      | Packs and installs **these** packages (ADR-073).                                                                                             |
| `suppressions:verify`       | —       | —      | The public-package suppressions register. Publishing is a flag, and the register is this repository's.                                       |
| `suppressions:list`         | —       | —      | The same script under `--list`, printing that register's entries.                                                                            |
| `suppressions:packages`     | —       | —      | The same script under `--packages`, printing which workspaces here are public.                                                               |
| `bench:array-ops`           | —       | —      | The measurement behind one of this repository's ADRs. A consumer inherits the conclusion, not the probe.                                     |
| `changelog:generate`        | —       | —      | Release material; a leaf repository has none (#1073).                                                                                        |
| `release:add`               | —       | —      | Opens a changeset. A leaf repository runs none.                                                                                              |
| `release:status`            | —       | —      | Reports the changesets pending since the default branch.                                                                                     |
| `release:version`           | —       | —      | Consumes them into version bumps and a lockfile update.                                                                                      |
| `fallow:refresh-report`     | —       | —      | Refreshes a derived complexity document keyed to this repository's thresholds and baselines.                                                 |

## Applying the criteria to files this pass did not cover

The criteria are only worth writing down if a reader can apply them without this
document's tables. Three files outside every table above, sorted by the two rules
and nothing else.

**`docker/local/docker-compose.yml`.** Profile: it defines a database, and there
is no database below `full`, so `full`. Update: image tag, ports, volume names
and credentials are the consumer's, and nothing reads it to decide pass or fail —
an edit that is wrong fails loudly, at connection time. So `seed`.

**`docs/agents/dependency-advisories.json`.** Profile: `deps:audit` is the only
thing that reads it and that gate is `repo`, so `repo`. Update: every entry is an
allowance this consumer granted, with their own expiry date. It is theirs to
write, so `seed`. The schema it must satisfy is enforced by the gate, which is a
package — the register is the data, not the decision.

**`packages/repo-standards/scripts/commit-convention.mjs`.** Profile: commits and
branches are `repo`-rung facts, so `repo`. Update: it is the one spec behind the
commit hook, the pull request gate and the changelog grouping. A consumer editing
it gets a green hook on a message the upstream gate rejects, and nothing in their
tree can tell. So `package`.

The third is the falsification: it already lives in a package, so a criterion
answering "seed" there would be wrong, and it does not. The first two have no
placement yet, and the answers match what the tables above give comparable
files — the database lane is `full`/`seed` like `db:up`, and a register read by a
gate is `seed` beside a `package` gate, like the coordination task template.

## Zero usage

`vp run usage:report` names every harness artifact it can measure. Its own
caveats bound what a number here is worth: transcripts are local and Claude-only,
observation runs continuously back only to the day the snapshot first recorded
the current retention, and path rules are reported as **not measurable** on
purpose, because nothing invokes one by name and the available proxy reads the
same at both ends. A skill declaring `paths:` frontmatter is loaded the same way,
so it sits in that last position too — several rows below are there.

**Nothing above is marked shippable because it is used, and nothing is kept back
because it is not.** A zero opens a classification rather than settling one, and
every zero-usage artifact carries one of three:

| Classification   | Meaning                                                                                                                    |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **reachability** | Something would have used it and did not reach it, or nothing in the window could have. The zero is about the measurement. |
| **superseded**   | The job moved. Delete the artifact and leave a pointer to whatever does the job now.                                       |
| **unneeded**     | Nothing wants it. Delete it.                                                                                               |

| Artifact                      | Classification   | Why                                                                                                                                                                                                                                                                        |
| ----------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `codebase-explorer`           | **superseded**   | The harness's own exploration subagent carries the same job and is invoked heavily in the same window, by a name this repository does not define.                                                                                                                          |
| `quality-gate` (subagent)     | **superseded**   | The gate is run in-line by the builder, and `quality-gate-workflow` is invoked directly. The dispatch wrapper is what nothing reaches for.                                                                                                                                 |
| `product-requirement`         | **reachability** | The requirement register was written in this window — the report's own register table shows the commits — without the skill being invoked. The job happened; the skill was not reached.                                                                                    |
| `refactor-verified`           | **reachability** | Dispatched through `/epic` and its own slash command, and what a transcript records is the subagents it dispatches. Both of those are among the most-invoked things measured.                                                                                              |
| `react-19`                    | **reachability** | It declares `paths:` on `**/*.tsx`, so it loads when one is opened and nothing invokes it by name. React work did land in the span the transcripts cover; the zero measures the instrument.                                                                                |
| `react-router-framework-mode` | **reachability** | It declares `paths:` on `routes/**` and the router config, and commits in the span touched those. Path-loaded, so never invoked by name.                                                                                                                                   |
| `store-pattern`               | **reachability** | It declares `paths:` on `contexts/**` and the store hooks, and the Table's contexts changed repeatedly in the span. Same measurement gap.                                                                                                                                  |
| `typescript-api-engineering`  | **reachability** | It covers designing an HTTP API for a Node backend, and this repository authors none — `@lcabrera/api` is a browser-safe fetch layer, `@lcabrera/server` is data access, and no HTTP framework is installed. Nothing in the span could have reached it.                    |
| `architecture-guard`          | **reachability** | The Table's wiring changed repeatedly in the span — its `ARCHITECTURE.md` files move in commit after commit — and this was dispatched for none of it, while the generic exploration subagent was dispatched many times. Something would have used it and did not reach it. |
| `lint-toolchain`              | **reachability** | It declares `paths:` on the analyser configs, so it loads when one is opened rather than being invoked. Commits in the span touched those files.                                                                                                                           |
| `linter-checker`              | **reachability** | Its first instruction runs a task it is blocked on, and the findings arrive from the gate instead. Blocked and unused argue in the same direction and neither settles it.                                                                                                  |
| `fallow-code-checker`         | **reachability** | Its first instruction runs `vp run fallow:report`, the task it is blocked on, and the audit already runs on every pull request regardless.                                                                                                                                 |
| `code-smell-checker`          | **reachability** | An audit over a tree, invoked on demand, and none was asked for. It names no task, so the analyser skills' blocker does not reach it.                                                                                                                                      |
| `code-smell-zen`              | **reachability** | An audit over a diff, invoked on demand, and none was asked for. Its first step runs a script from its own directory, so nothing blocks it.                                                                                                                                |
| `health-swarm`                | **reachability** | A periodic sweep, and the transcripts on one machine do not reach back far enough to say whether one was due.                                                                                                                                                              |
| `fallow-scan` (subagent)      | **reachability** | Its own text sends it to `fallow-code-checker/SKILL.md`, so the blocked task is its first instruction too.                                                                                                                                                                 |
| `changelog.yml`               | **reachability** | Its only trigger is a pushed `v*` tag, and this repository carries no such tag at all. The zero measures the tag, not the workflow.                                                                                                                                        |
| `code-smell-shared`           | not measured     | A support directory with no `SKILL.md`, so nothing invokes it by name. It is reached through the two skills that read it.                                                                                                                                                  |

Some of these are actionable now, and none is a shipping decision.
`product-requirement` and `architecture-guard` each carry a reachability defect
worth fixing at the description: the work that would have used them happened, and
neither was reached. `codebase-explorer` is a candidate for deletion here even
though its verdict above is **portable** — a skill can be worth shipping and not
worth keeping in the repository that wrote it.

## What this means for the shipping order

`codebase-explorer`, `react-19` and `react-router-framework-mode` need no
parameterising, so they ship first and test the materialiser without also
testing a content rewrite.

**`epic` and `refactor-verified` were expected to follow, and cannot.** The plan
assumed the prose set was independent of the gate runtime because the skills
themselves are. Measuring the documents they bind to — rather than the skills —
showed otherwise:

```bash
devkit closure docs/agents docs/coordination
```

The orchestration contract, the agent-review contract and the coordination
README cite ADRs, the docs index, workflows, a generated report artifact and the
gate script; the command above prints each escape with the line it sits on. None
of that is a skill's own text, and none of it travels; shipping the skills now
would hand a consumer files whose first instruction is to read something they do
not have.

So the order inverts: the **documents** gate the prose, not the other way round.
`epic` and `refactor-verified` ship after the gate runtime and the scaffolding
seeds, and after the claim protocol is split from this repository's register —
the generic half is what a consumer needs, and it is currently interleaved with
ADR citations and gate wiring that are ours alone.

The two axes add one ordering fact the earlier pass did not have. Every gate in
the root-script tables above is `package`, and none of them has moved yet, so
every `repo`-rung workflow seed that names a bin is waiting on one that is only
partly there. Moving those scripts is what unblocks the workflow seeds, the hook
seeds and the blocked analyser skills at once. `copilot-setup-steps.yml` is the
exception and needs none of it: it names no bin, only the bootstrap.

## Mechanisms considered and not adopted

Surveying how comparable projects distribute their skills
([#716](https://github.com/luciocabrera/lcabrera-stack/issues/716)) turned
up three shapes worth a verdict here, so a later reader can tell them from
mechanisms nobody looked at. ADR-081 carries the reasoning; this is the pointer.

| Mechanism                                                             | Verdict      | Where it is decided              |
| --------------------------------------------------------------------- | ------------ | -------------------------------- |
| An editor-native plugin manifest, alongside materialisation           | **deferred** | ADR-081, option 5                |
| Bundling the prose and the gate runtime into one installable unit     | **rejected** | ADR-081, option 4 + Alternatives |
| A personalisation flow that drafts a consumer their own routing skill | **deferred** | ADR-081, Alternatives            |

The first two are about this package's shape and are settled. The third is a
feature request nobody has made; it is recorded so that "we never thought of it"
and "we thought of it and are waiting for a consumer" stay distinguishable.
