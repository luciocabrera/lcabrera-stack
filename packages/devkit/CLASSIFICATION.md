# What ships, what is parameterised, and what stays

The verdict for every skill, path rule and subagent definition in this
repository, and the reason behind each one. A later reader must be able to tell
"considered and kept back" from "not looked at", which is why nothing here is
left off the table.

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

## Verdicts

| Verdict           | Meaning                                                                                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **portable**      | Ships as it stands. Its closure is empty, or the only escapes are tools every consumer has.                                                               |
| **parameterise**  | Ships once its escapes become one of the three allowed forms — a file that travels with it, a bin from a declared peer, or a key in `devkit.config.json`. |
| **repo-specific** | Does not ship. It describes something true only here.                                                                                                     |
| **blocked**       | Would ship, but its runtime is not published. Distinct from repo-specific: the verdict is about availability, not fit.                                    |

## Hard and soft dependencies

A second, independent reading of the same rows. It is **not** a verdict and does
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

Half of this is gated and half is not, and the split is worth knowing before
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

| Skill                         | Verdict           | Dependency | Reason                                                                                                                                                                                                                                                                                                                                                                                                       |
| ----------------------------- | ----------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `codebase-explorer`           | **portable**      | —          | Closure is empty. Investigation procedure with no repository in it.                                                                                                                                                                                                                                                                                                                                          |
| `react-19`                    | **portable**      | —          | Closure is empty. React 19 and compiler patterns, framework-level throughout.                                                                                                                                                                                                                                                                                                                                |
| `react-router-framework-mode` | **portable**      | —          | One escape, and it is an example citing this repo's app manifest. Generalise the example; the reference material is framework documentation.                                                                                                                                                                                                                                                                 |
| `epic`                        | **parameterise**  | **hard**   | Needs its orchestration contract, the coordination README and both subagent definitions — all of which ship with it. Its one reference to the repository's root agent document becomes a config key, since a consumer's is named by them.                                                                                                                                                                    |
| `refactor-verified`           | **parameterise**  | **soft**   | Same shape: two contract documents travel with it, and it binds to `commit-and-pr` and `quality-gate-workflow`, which ship alongside.                                                                                                                                                                                                                                                                        |
| `commit-and-pr`               | **parameterise**  | **hard**   | The convention it enforces is executable and moves to the gate runtime package; the PR and issue templates it checks against ship as seeds. Until both land it materialises but cannot run.                                                                                                                                                                                                                  |
| `quality-gate-workflow`       | **parameterise**  | **hard**   | The stage order is portable; every stage names a task through the toolchain, so the commands become the config's command map. Its React Doctor and Biome references are this repo's analysers and drop out.                                                                                                                                                                                                  |
| `store-pattern`               | **parameterise**  | **soft**   | The pattern is general. Its references point into the live Table implementation, so those become excerpts that travel or generic examples — a consumer has no `packages/ui`.                                                                                                                                                                                                                                 |
| `health-swarm`                | **parameterise**  | **hard**   | The scout charters are general; the traps, report locations and helper scripts they cite are not. The heaviest of the parameterise set, and worth doing after the lighter ones prove the config surface.                                                                                                                                                                                                     |
| `typescript-api-engineering`  | **parameterise**  | **soft**   | Already split into a generic half and a project half — the shape everything else is being moved toward. The generic half ships; the project half stays.                                                                                                                                                                                                                                                      |
| `unslop`                      | **parameterise**  | **hard**   | The three levels and the calibration procedure are general. Its voice files are not: `repo-voice.md` is derived from this repository's own prose, and `style-profile.md` quotes the maintainer directly and must never ship. Step 1 mandates reading a voice file, so a consumer needs one generated from theirs before the skill runs at all. Its citations of the root agent document and an ADR drop out. |
| `product-requirement`         | **parameterise**  | **hard**   | The register discipline travels: one file per requirement, a declared state, acceptance a machine can decide. What does not is the register it drives. A consumer has no `docs/product/`, so the README, the vision page and the requirement template ship as seeds the way the ADR and coordination registers already do, and the named example requirements become generic ones.                           |
| `lint-toolchain`              | **repo-specific** | —          | It documents _this_ repository's analyser topology: which of four engines owns which rule, the suppressions register, the Sonar wiring. Useful to read, false everywhere else.                                                                                                                                                                                                                               |
| `releasing`                   | **repo-specific** | —          | The Changesets flow, the publish gates and the label taxonomy of the `@lcabrera/*` packages specifically.                                                                                                                                                                                                                                                                                                    |
| `linter-checker`              | **blocked**       | —          | Runs `vp run lint:report`, a root repository script.                                                                                                                                                                                                                                                                                                                                                         |
| `fallow-code-checker`         | **blocked**       | —          | Runs `vp run fallow:report` and reads the root `.fallowrc.json`; also coverage-merge from the repository root.                                                                                                                                                                                                                                                                                               |
| `code-smell-checker`          | **blocked**       | —          | Same root tasks. Its report contract ships beside it in `code-smell-shared/`.                                                                                                                                                                                                                                                                                                                                |
| `code-smell-zen`              | **blocked**       | —          | Same root tasks.                                                                                                                                                                                                                                                                                                                                                                                             |
| `code-smell-shared`           | **blocked**       | —          | The shared half of the two `code-smell` skills; it ships if and when they do.                                                                                                                                                                                                                                                                                                                                |

Reading the **hard** rows: `epic` names the consumer's root agent document
through config, so without it an orchestrator is told to read a file nobody
named. `commit-and-pr` and `quality-gate-workflow` each drive the toolchain, and
a gate procedure whose stages resolve to nothing reports a clean pass that means
nothing. `health-swarm`'s scouts write to report locations that come from config;
unset, a scout produces its findings nowhere. Every **soft** row loses
specificity and keeps every instruction followable.

The blocked group is one decision, not one per row: each skill's first
instruction runs a task defined in this repository's root manifest, which a
consumer installing the skill would not have. ADR-081 blocked them on the
scanner runtime being private; [ADR-091](../../docs/decisions/ADR-091-retire-the-scan-report-pipeline.md)
retired that runtime and moved the report contract in beside the skills, so what
remains is the root tasks. Publishing them means giving those tasks a home a
consumer can install — the same question ADR-081 deferred, asked of a smaller
surface.

## Path rules

| Rule                  | Verdict          | Dependency | Reason                                                                                                                                                                   |
| --------------------- | ---------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `routes-data.md`      | **portable**     | —          | Loader/action data flow, framework-level. Portable since #860 rewrote its examples to name the concept; before that its closure was empty and it was still not portable. |
| `typescript.md`       | **parameterise** | **soft**   | The standards are general; the ADR citations, the benchmark script and the generated-tsconfig reference are this repository's.                                           |
| `testing.md`          | **parameterise** | **hard**   | General except its toolchain import convention, which is an ADR here and a config key in a consumer.                                                                     |
| `react-components.md` | **parameterise** | **soft**   | The component conventions travel; the inventory paths they point at are per-repository and belong in config.                                                             |
| `scripts.md`          | **parameterise** | **soft**   | The structure, purity and size standards are general. The exemplar it names and the gate that enforces the ceiling move to the gate runtime package.                     |

`testing.md` is the hard row: its import convention names the module tests must
import from, so a consumer without that key is left with a rule instructing them
to import from nowhere. The **soft** rows lose a citation or a pointer.

`routes-data.md` is worth reading as a warning about the instrument. It earned
**portable** on an empty closure, and an empty closure is a true answer to the
wrong question: the probe resolves links, fenced commands and inline paths, and
a package name written in prose is none of the three. The rule named this
repository's UI and server packages in four sentences and read clean anyway
(#860). A verdict of portable now needs the seed gate to agree, since that one
reads words rather than structure.

## Subagent definitions

| Definition           | Verdict          | Dependency | Reason                                                                                                         |
| -------------------- | ---------------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `refactor-builder`   | **parameterise** | **hard**   | Only escapes are toolchain commands, which the command map answers. Ships with `epic` and `refactor-verified`. |
| `refactor-verifier`  | **parameterise** | **hard**   | Same, plus the two contract documents it certifies against — which travel with `refactor-verified`.            |
| `quality-gate`       | **parameterise** | **hard**   | Binds to `quality-gate-workflow` and moves when it does.                                                       |
| `architecture-guard` | **parameterise** | **hard**   | The procedure is general; the inventory paths it reads are per-repository config.                              |
| `fallow-scan`        | **blocked**      | —          | Binds to `fallow-code-checker`, and inherits its verdict.                                                      |

Every **parameterise** row here is hard, and for one reason: a subagent
definition is executed, not read. Its commands and the paths it reads are its
whole input, so an unanswered one leaves an agent that runs and reports without
having examined anything — which reads exactly like a pass.

## Scaffolding

The gates a consumer installs are only half of what makes them run. The workflows
that invoke them, the hooks that run them before a push, the templates they check
against and the registers they read are path-discovered exactly like a skill, so
they use the same mechanism and the same manifest — and they are the most
repository-coupled material in the set, which is why every one is a rewrite
rather than a copy.

They ship under the **`full`** profile rather than `agent`, because that is where
the line falls: `agent` is what an agent reads, `full` adds what CI and git run.

| Seed                                                        | Verdict          | Dependency | Reason                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------- | ---------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workflows/pr-standards.yml`                                | **parameterise** | **hard**   | The procedure is the gate runtime's; the install step is the consumer's. Refused outright without `commands.install`, since a workflow that cannot install cannot check anything.                                                                                                                                         |
| `workflows/issue-standards.yml`                             | **parameterise** | **hard**   | Same shape, one gate.                                                                                                                                                                                                                                                                                                     |
| `workflows/check.yml`                                       | **parameterise** | **hard**   | Format, lint, types and tests come from the command map; the register and decision gates come from the runtime. Needs `install`, `check` and `test`.                                                                                                                                                                      |
| `workflows/coordination-close.yml`                          | **parameterise** | **hard**   | Deletes the task file a merged pull request claimed. The register's location comes from the runtime's own config, so the workflow never repeats it.                                                                                                                                                                       |
| `workflows/dependency-audit.yml`                            | **parameterise** | **hard**   | The audit command is the consumer's; filing the finding as an issue against the seeded template is not.                                                                                                                                                                                                                   |
| `hooks/commit-msg`, `hooks/pre-push`                        | **parameterise** | **hard**   | Invoke the runtime's bins by install path, and the consumer's `check`/`test` for the rest. They arrive **executable** — a hook without the bit is skipped by git without a word, which reads like a hook that passed.                                                                                                     |
| `templates/pull_request_template.md`                        | **portable**     | —          | The sections are the gate runtime's, and it names the allowed types itself when it rejects one.                                                                                                                                                                                                                           |
| `templates/ISSUE_TEMPLATE/standard_issue.md`                | **portable**     | —          | Same.                                                                                                                                                                                                                                                                                                                     |
| `coordination/README.md`, `coordination/tasks/_TEMPLATE.md` | **portable**     | —          | The claim protocol and the task schema, with this repository's board, its one-step claim command and its decision citations removed. In the `agent` profile, not `full`: the skills bind to it.                                                                                                                           |
| `decisions/_TEMPLATE.md`                                    | **portable**     | —          | The record shape. The numbering rule travels; the taxonomy citation does not.                                                                                                                                                                                                                                             |
| `decisions/README.md`                                       | **portable**     | —          | Generated, not authored: byte-identical to what the ADR gate renders for a default home, pinned by `scripts/lib/devkit-seeds.test.mjs` — which lives outside both packages because neither may depend on the other. Without it a fresh home fails its own gate; without the test it would drift into failing it silently. |
| `root/COMMANDS.md`                                          | **portable**     | —          | Lists only what the two packages provide, and the config keys a consumer supplies.                                                                                                                                                                                                                                        |

### Workflows deliberately not shipped

Each is named so a later reader can tell "considered and kept back" from "not
looked at".

| Workflow                                                                                                       | Why not                                                                                                                                                                                                                              |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `sonar-issue-gate`, `lighthouse`                                                                               | Bound to an external account and its project keys. A seed carrying them is a workflow that fails on its first run.                                                                                                                   |
| `claude-review`, `copilot-review-gate`, `copilot-setup-steps`, `agent-review-verdict`, `review-gate-reconcile` | Each needs a review integration and its credentials. A workflow that skips every step when a secret is absent reports success to a consumer who has nothing working, which is worse than not shipping it.                            |
| `add-to-project`, `project-status`, `labeler`, `sync-labels`                                                   | This repository's planning board and label taxonomy. Useful, and true nowhere else.                                                                                                                                                  |
| `release`, `release-audit`, `changelog`                                                                        | The Changesets flow of the `@lcabrera/*` packages specifically — the same verdict the `releasing` skill has.                                                                                                                         |
| `secret-scan`                                                                                                  | Configured against this repository's scanner and its allowlist.                                                                                                                                                                      |
| `validate-skills`                                                                                              | Checks the skills **this** repository authors, against its own layout. A consumer's skills are the ones it materialised, and the manifest already reports those.                                                                     |
| `check-safe`                                                                                                   | Its shippable half is `workflows/check.yml`. The rest — four analysers, a coverage merge, the publishing gates and a long tail of verifiers reading this repository's own registers — is this repository's gate and travels nowhere. |

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
README together cite four ADRs, the docs index, two workflows, a generated report
artifact and the gate script. None of that is a skill's own text, and none of it
travels; shipping the skills now would hand a consumer files whose first
instruction is to read something they do not have.

So the order inverts: the **documents** gate the prose, not the other way round.
`epic` and `refactor-verified` ship after the gate runtime and the scaffolding
seeds, and after the claim protocol is split from this repository's register —
the generic half is what a consumer needs, and it is currently interleaved with
ADR citations and gate wiring that are ours alone.

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
