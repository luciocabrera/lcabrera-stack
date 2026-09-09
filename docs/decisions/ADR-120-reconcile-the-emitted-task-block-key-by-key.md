---
governs:
  - devkit
  - repo-standards
---

# ADR-120 — Reconcile the emitted task block key by key

**Status:** Accepted

## Context

`@lcabrera/devkit` materialises a set of files into a consumer's repository and
records a hash per file, so a later run can tell a file the consumer edited from
one still holding what the kit wrote. That record is what makes an upstream fix
safe to apply to one file and impossible to apply to another.

The task block in the root manifest was outside it, in both of the halves it is
written from. `create` wrote the blueprint's tasks into `package.json` from a
constant in the package's code and nothing looked at them again. `init` wired the
gate tasks by a second route that only ever added: a name already in the block
was skipped, and a name that left the kit stayed where it was. Neither route was
reached by `sync`, which never opened the manifest at all.

Adding a task of their own is the first thing a consumer does to that file, and
there was no route by which an upstream change could reach either half of it: a
command line corrected upstream never arrived, and a task the kit withdrew went
on naming a binary it no longer ships. Every consumer's block froze on the day
the repository was set up, and nothing reported it.

Merging a shipped file into an edited one is the general problem, and it is not
solved here. This block is not that problem: it is JSON, a map of name to
command, so a key can be judged without judging the file.

## Decision

The task block is derived from the lists in the package and reconciled on every
run — both halves of it, through one plan — by the rule already written for
files.

`.devkit-manifest.json` records the command this kit last wrote for each task,
beside the hashes it records for files. `classifyMaterialisation` then answers
per key exactly as it does per file: a key still holding the recorded command is
**updated**, a key the consumer changed is **modified** and kept, a key the
consumer wrote before this kit ever wrote one is a **conflict** and kept, a key
this kit ships and the manifest lacks is **added**, and a recorded key this kit
no longer ships is **removed**. Every one of those is named in the run's report,
so nothing is held back silently.

Three boundaries make that safe.

**A group says whether a run may establish it.** The tasks arrive as groups
because they are not established alike: `init` is the command that wires the gate
tasks into a repository, while the blueprint's block is written once, by
`create`, into a manifest that declares the binaries it names. A group a run may
not establish is written into only where this kit provably wrote it before — a
record, or a key whose value is exactly the shipped command, which no other run
could have put there. Where a group has neither, its plan is empty, so a
repository that never took a group does not acquire it.

**Whether a command resolves decides what may be wired, not what belongs in the
file.** A task whose bin is not installed is withheld from a manifest that does
not already hold it, for the reason the rung tagging exists — a task naming a
missing binary is a `command not found` on the consumer's first run. A task
already in the manifest is reconciled whatever is installed, because what is on
one machine says nothing about what the file should contain.

**The departed set is read against every name this version ships, at any
profile**, rather than against the groups one run happens to plan. A recorded key
is proof of authorship whatever group it came from, so reading it against one
profile's groups would take a narrower profile to mean the wider rung's tasks had
been withdrawn, and delete them.

The shipped `COMMANDS.md` documents every task the kit wires, spelling each one
through the `commands.run` placeholder rather than a literal runner, and the
consumer's own `commands:verify` gate — wired from the `monorepo` rung up — fails
on a task documented nowhere in it or documented and absent.

**A gate travels with what it checks.** `commands:verify` is wired only where
the blueprint is, because the document it reads names the blueprint's tasks: in a
repository that took the gates and not the blueprint it would be red the day it
arrived, over a section its own prose says arrives with `create`. That is the
same withholding rule a missing binary already gets, on a second condition.

**That gate reads the same key.** It assumed one toolchain's spelling, so a
repository whose tasks are documented as its own runner spells them was told
every one of them was undocumented, with a remedy already carried out — a gate
red on the day it is wired, saying something false. It now takes the spelling
from `commands.run`, and takes the task list from the manifests unless the
configured runner resolves a task from more than them, in which case it asks the
runner as before. A repository that has never set the key is read exactly as it
was. A test in this
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
materialised with a placeholder in it. That exposed a message this decision also
corrects: every report for an unanswered key sent the reader to `sync`, which is
the one command that cannot write a config key, so both `sync` and
`doctor --check` now name the keys and the command that adds them.

The seed lists the tasks rather than tabulating them. A substituted runner is
shorter than the placeholder it replaces, so a table's header row no longer
matches its widest cell and a formatter run in the consumer's own tree reports
the file it was just handed.

The command reference still documents the blueprint's tasks in a repository that
does not have them, and nothing but its own prose says so. Rendering that section
per repository is what it would take to close, and that means a materialised file
diverging from the shipped one on day one — a repository reporting drift the day
it was set up, which is the failure the manifest exists to avoid.

Wiring `commands:verify` at this rung also makes that document one the consumer
has to edit. The gate fails on a root script the reference does not name, and the
remedy it prints is to write the script in — so the first task a consumer adds of
their own turns a materialised file into a modified one, and `doctor --check`
reports it from then on. `doctor --accept` is the escape and it is the documented
one, but it costs more for this file than for any other: an acknowledgement is
keyed to the on-disk hash, so it quiets the file even when the package's own copy
moves on. A consumer who acknowledges the command reference stops receiving the
kit's revisions to the one document this gate exists to keep true. So the day-one
divergence rejected above is not avoided here, only moved to day two — and moved
to every consumer rather than to those who take the blueprint without the gates.
Closing it needs a region of the file the recorded hash does not cover, which is
a change to how a file is recorded rather than to this block, and is not made
here (#1156).

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
