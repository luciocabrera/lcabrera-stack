---
governs:
  - devkit
---

# ADR-116 — Reconcile the emitted task block key by key

**Status:** Accepted

## Context

`@lcabrera/devkit` materialises a set of files into a consumer's repository and
records a hash per file, so a later run can tell a file the consumer edited from
one still holding what the kit wrote. That record is what makes an upstream fix
safe to apply to one file and impossible to apply to another.

The root manifest was outside it. From the `monorepo` rung up, `create` wrote a
task block into `package.json` and nothing looked at it again: the block was a
constant in the package's code, copied once. Adding a task of their own is the
first thing a consumer does to that file, and there was no route by which a task
the kit added later could reach them — not `sync`, which never opened the
manifest, and not `init --upgrade`, whose gate-task table has no rung the block
belongs to. So every consumer's block froze on the day the repository was made,
and nothing reported it.

Merging a shipped file into an edited one is the general problem, and it is not
solved here. This block is not that problem: it is JSON, a map of name to
command, so a key can be judged without judging the file.

## Decision

The task block is derived from one list in the package and reconciled on every
run, by the rule already written for files.

`.devkit-manifest.json` records the command this kit last wrote for each task,
beside the hashes it records for files. `classifyMaterialisation` then answers
per key exactly as it does per file: a key still holding the recorded command is
**updated**, a key the consumer changed is **modified** and kept, a key the
consumer wrote before this kit ever wrote one is a **conflict** and kept, a key
this kit ships and the manifest lacks is **added**, and a recorded key this kit
no longer ships is **removed**. Every one of those is named in the run's report,
so nothing is held back silently.

Two boundaries make that safe. A manifest holding no task this kit provably wrote
gets nothing: a key whose value is exactly the shipped command is proof of
authorship and is adopted into the record, and where nothing matches, the plan is
empty. And the reconciliation runs only from the `monorepo` rung up, so a profile
below the one that emits the block never removes a key from a manifest it does
not own.

The shipped `COMMANDS.md` documents every task the kit wires, spelling each one
through the `commands.run` placeholder rather than a literal runner, and the
consumer's own `commands:verify` gate — wired from the `monorepo` rung up — fails
on a task documented nowhere in it or documented and absent. A test in this
package holds the seed and the wired list to the same set, because both ship from
here and a mismatch would otherwise reach a consumer as a repository failing its
own gate on the day it was set up.

## Consequences

The manifest gains a `tasks` block, and a devkit that predates this decision
drops it when it rewrites the file — after which the next current run re-adopts
whatever still matches, so the loss costs the unmatched keys' history and nothing
else.

`commands.run` is a new config key, and a shipped file now carries a placeholder
for it. A consumer whose config predates it gets `COMMANDS.md` reported as
`unresolved` and not written, until `devkit init --upgrade` adds the key — loud,
by the same rule every other unanswered placeholder follows, rather than a file
materialised with a placeholder in it.

The seed lists the tasks rather than tabulating them. A substituted runner is
shorter than the placeholder it replaces, so a table's header row no longer
matches its widest cell and a formatter run in the consumer's own tree reports
the file it was just handed.

Adoption by value can be wrong in one direction: a repository that independently
holds a task spelled exactly as this kit spells it is read as having taken the
block, and the rest of the block is then added to it. The alternative — writing
nothing until a record exists — leaves every repository made before this decision
frozen, which is the defect being fixed.

## Alternatives considered

1. **Merge the shipped seed and the local file for every asset.** Rejected: for
   prose there is no key to merge on, so the merge would be a diff3 whose
   conflicts a consumer has to resolve in a file they did not write. The property
   that makes this tractable is the block being a map, and it does not generalise.

2. **Parse the task list out of the shipped `COMMANDS.md` and derive the block
   from the document.** Rejected on a constraint rather than on taste: a seed may
   not name a runner — `vp run seeds:verify` fails on the runner word in any
   shipped file, blueprint included — so the command lines cannot live in the
   document at all. Splitting the name into the document and the command into the
   code would put one datum in two files. The list stays in the code, the names
   are documented, and a test holds the two to the same set.

3. **Write the block from `init` into any repository at the rung.** Rejected: the
   rung's other manifest fields are `create`-only for the same reason, and a
   repository that took the rung without them would be handed tasks naming
   binaries nothing declares.

## References

- [#1077](https://github.com/luciocabrera/lcabrera-stack/issues/1077)
- [ADR-069](./ADR-069-publish-the-shared-toolchain.md)
