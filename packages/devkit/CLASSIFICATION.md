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

## Skills

| Skill                         | Verdict           | Dependency | Reason                                                                                                                                                                                                                                    |
| ----------------------------- | ----------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `codebase-explorer`           | **portable**      | —          | Closure is empty. Investigation procedure with no repository in it.                                                                                                                                                                       |
| `react-19`                    | **portable**      | —          | Closure is empty. React 19 and compiler patterns, framework-level throughout.                                                                                                                                                             |
| `react-router-framework-mode` | **portable**      | —          | One escape, and it is an example citing this repo's app manifest. Generalise the example; the reference material is framework documentation.                                                                                              |
| `epic`                        | **parameterise**  | **hard**   | Needs its orchestration contract, the coordination README and both subagent definitions — all of which ship with it. Its one reference to the repository's root agent document becomes a config key, since a consumer's is named by them. |
| `refactor-verified`           | **parameterise**  | **soft**   | Same shape: two contract documents travel with it, and it binds to `commit-and-pr` and `quality-gate-workflow`, which ship alongside.                                                                                                     |
| `commit-and-pr`               | **parameterise**  | **hard**   | The convention it enforces is executable and moves to the gate runtime package; the PR and issue templates it checks against ship as seeds. Until both land it materialises but cannot run.                                               |
| `quality-gate-workflow`       | **parameterise**  | **hard**   | The stage order is portable; every stage names a task through the toolchain, so the commands become the config's command map. Its React Doctor and Biome references are this repo's analysers and drop out.                               |
| `store-pattern`               | **parameterise**  | **soft**   | The pattern is general. Its references point into the live Table implementation, so those become excerpts that travel or generic examples — a consumer has no `packages/ui`.                                                              |
| `health-swarm`                | **parameterise**  | **hard**   | The scout charters are general; the traps, report locations and helper scripts they cite are not. The heaviest of the parameterise set, and worth doing after the lighter ones prove the config surface.                                  |
| `typescript-api-engineering`  | **parameterise**  | **soft**   | Already split into a generic half and a project half — the shape everything else is being moved toward. The generic half ships; the project half stays.                                                                                   |
| `lint-toolchain`              | **repo-specific** | —          | It documents _this_ repository's analyser topology: which of four engines owns which rule, the suppressions register, the Sonar wiring. Useful to read, false everywhere else.                                                            |
| `releasing`                   | **repo-specific** | —          | The Changesets flow, the publish gates and the label taxonomy of the `@lcabrera/*` packages specifically.                                                                                                                                 |
| `linter-checker`              | **blocked**       | —          | Prose around scanners in an unpublished package.                                                                                                                                                                                          |
| `fallow-code-checker`         | **blocked**       | —          | Same, plus coverage-merge scripts from the repository root.                                                                                                                                                                               |
| `code-smell-checker`          | **blocked**       | —          | Same runtime; its report contract lives in the unpublished package.                                                                                                                                                                       |
| `code-smell-zen`              | **blocked**       | —          | Same runtime.                                                                                                                                                                                                                             |
| `code-smell-shared`           | **blocked**       | —          | The shared half of the two `code-smell` skills; it ships if and when they do.                                                                                                                                                             |
| `app-graph`                   | **blocked**       | —          | Not prose at all — a report generator importing the unpublished package and `ts-morph`.                                                                                                                                                   |

Reading the **hard** rows: `epic` names the consumer's root agent document
through config, so without it an orchestrator is told to read a file nobody
named. `commit-and-pr` and `quality-gate-workflow` each drive the toolchain, and
a gate procedure whose stages resolve to nothing reports a clean pass that means
nothing. `health-swarm`'s scouts write to report locations that come from config;
unset, a scout produces its findings nowhere. Every **soft** row loses
specificity and keeps every instruction followable.

The blocked group is one decision, not six: it is the scanner runtime, kept
private in ADR-081 because publishing it would be justified by these skills
alone and no second repository has asked for them. When one does, that request
decides whether the scanners publish under their own name or fold into the gate
runtime package, and this whole group moves with it.

## Path rules

| Rule                  | Verdict          | Dependency | Reason                                                                                                                                               |
| --------------------- | ---------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `routes-data.md`      | **portable**     | —          | Closure is empty. Loader/action data flow, framework-level.                                                                                          |
| `typescript.md`       | **parameterise** | **soft**   | The standards are general; the ADR citations, the benchmark script and the generated-tsconfig reference are this repository's.                       |
| `testing.md`          | **parameterise** | **hard**   | General except its toolchain import convention, which is an ADR here and a config key in a consumer.                                                 |
| `react-components.md` | **parameterise** | **soft**   | The component conventions travel; the inventory paths they point at are per-repository and belong in config.                                         |
| `scripts.md`          | **parameterise** | **soft**   | The structure, purity and size standards are general. The exemplar it names and the gate that enforces the ceiling move to the gate runtime package. |

`testing.md` is the hard row: its import convention names the module tests must
import from, so a consumer without that key is left with a rule instructing them
to import from nowhere. The **soft** rows lose a citation or a pointer.

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
([#716](https://github.com/luciocabrera/vite-react-compiler/issues/716)) turned
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
