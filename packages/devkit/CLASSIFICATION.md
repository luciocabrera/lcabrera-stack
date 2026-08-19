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

It reports three kinds of escape, because they fail differently for a consumer:
a **link** is a file they will not have, a **command** is a tool their shell may
not resolve, an **import** is a module their install will not provide. Re-run it
rather than trusting this table's age; the verdicts are judgements, the escapes
underneath them are measurements.

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

## Skills

| Skill                         | Verdict           | Reason                                                                                                                                                                                                                                    |
| ----------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `codebase-explorer`           | **portable**      | Closure is empty. Investigation procedure with no repository in it.                                                                                                                                                                       |
| `react-19`                    | **portable**      | Closure is empty. React 19 and compiler patterns, framework-level throughout.                                                                                                                                                             |
| `react-router-framework-mode` | **portable**      | One escape, and it is an example citing this repo's app manifest. Generalise the example; the reference material is framework documentation.                                                                                              |
| `epic`                        | **parameterise**  | Needs its orchestration contract, the coordination README and both subagent definitions — all of which ship with it. Its one reference to the repository's root agent document becomes a config key, since a consumer's is named by them. |
| `refactor-verified`           | **parameterise**  | Same shape: two contract documents travel with it, and it binds to `commit-and-pr` and `quality-gate-workflow`, which ship alongside.                                                                                                     |
| `commit-and-pr`               | **parameterise**  | The convention it enforces is executable and moves to the gate runtime package; the PR and issue templates it checks against ship as seeds. Until both land it materialises but cannot run.                                               |
| `quality-gate-workflow`       | **parameterise**  | The stage order is portable; every stage names a task through the toolchain, so the commands become the config's command map. Its React Doctor and Biome references are this repo's analysers and drop out.                               |
| `store-pattern`               | **parameterise**  | The pattern is general. Its references point into the live Table implementation, so those become excerpts that travel or generic examples — a consumer has no `packages/ui`.                                                              |
| `health-swarm`                | **parameterise**  | The scout charters are general; the traps, report locations and helper scripts they cite are not. The heaviest of the parameterise set, and worth doing after the lighter ones prove the config surface.                                  |
| `typescript-api-engineering`  | **parameterise**  | Already split into a generic half and a project half — the shape everything else is being moved toward. The generic half ships; the project half stays.                                                                                   |
| `lint-toolchain`              | **repo-specific** | It documents _this_ repository's analyser topology: which of four engines owns which rule, the suppressions register, the Sonar wiring. Useful to read, false everywhere else.                                                            |
| `releasing`                   | **repo-specific** | The Changesets flow, the publish gates and the label taxonomy of the `@lcabrera/*` packages specifically.                                                                                                                                 |
| `linter-checker`              | **blocked**       | Prose around scanners in an unpublished package.                                                                                                                                                                                          |
| `fallow-code-checker`         | **blocked**       | Same, plus coverage-merge scripts from the repository root.                                                                                                                                                                               |
| `code-smell-checker`          | **blocked**       | Same runtime; its report contract lives in the unpublished package.                                                                                                                                                                       |
| `code-smell-zen`              | **blocked**       | Same runtime.                                                                                                                                                                                                                             |
| `code-smell-shared`           | **blocked**       | The shared half of the two `code-smell` skills; it ships if and when they do.                                                                                                                                                             |
| `app-graph`                   | **blocked**       | Not prose at all — a report generator importing the unpublished package and `ts-morph`.                                                                                                                                                   |

The blocked group is one decision, not six: it is the scanner runtime, kept
private in ADR-081 because publishing it would be justified by these skills
alone and no second repository has asked for them. When one does, that request
decides whether the scanners publish under their own name or fold into the gate
runtime package, and this whole group moves with it.

## Path rules

| Rule                  | Verdict          | Reason                                                                                                                                               |
| --------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `routes-data.md`      | **portable**     | Closure is empty. Loader/action data flow, framework-level.                                                                                          |
| `typescript.md`       | **parameterise** | The standards are general; the ADR citations, the benchmark script and the generated-tsconfig reference are this repository's.                       |
| `testing.md`          | **parameterise** | General except its toolchain import convention, which is an ADR here and a config key in a consumer.                                                 |
| `react-components.md` | **parameterise** | The component conventions travel; the inventory paths they point at are per-repository and belong in config.                                         |
| `scripts.md`          | **parameterise** | The structure, purity and size standards are general. The exemplar it names and the gate that enforces the ceiling move to the gate runtime package. |

## Subagent definitions

| Definition           | Verdict          | Reason                                                                                                         |
| -------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------- |
| `refactor-builder`   | **parameterise** | Only escapes are toolchain commands, which the command map answers. Ships with `epic` and `refactor-verified`. |
| `refactor-verifier`  | **parameterise** | Same, plus the two contract documents it certifies against — which travel with `refactor-verified`.            |
| `quality-gate`       | **parameterise** | Binds to `quality-gate-workflow` and moves when it does.                                                       |
| `architecture-guard` | **parameterise** | The procedure is general; the inventory paths it reads are per-repository config.                              |
| `fallow-scan`        | **blocked**      | Binds to `fallow-code-checker`, and inherits its verdict.                                                      |

## What this means for the first shipment

`codebase-explorer`, `react-19` and `react-router-framework-mode` need no
parameterising, so shipping them first tests the materialiser without also
testing a content rewrite. `epic` and `refactor-verified` come next: they need
nothing from the gate runtime, only their own documents travelling with them,
which is what proves the "a shipped file references only what ships with it"
rule before anything harder depends on it.
