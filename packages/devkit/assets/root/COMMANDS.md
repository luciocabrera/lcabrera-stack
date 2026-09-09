# Commands

What the installed kit provides, and what this repository has to supply for it.
Your own build, test and release commands belong here too — add them below and
keep this file true, because it is the first thing a new agent reads.

## 1. The two packages

| Role                 | Package name            | What it is                                                                                             |
| -------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------ |
| **the materialiser** | `FILL IN ON FIRST SYNC` | Puts the shipped files where they are discovered by path, and reports drift. Invoked as `devkit`.      |
| **the gate runtime** | `FILL IN ON FIRST SYNC` | The checks, as commands: commit messages, branch names, pull requests, issues, the register, the ADRs. |

**Write both names in, once, right after your first sync.** They are blank on
purpose: this file is shipped BY the materialiser, and a shipped file may not
name the repository it came from — so the package cannot introduce itself here.
Filling them in is the one thing that makes the rest of this setup
self-explaining.

It is not cosmetic. Every git hook and every gate-checking workflow fails with
_"install the gate runtime package named in COMMANDS.md"_ when that package is
missing — which is the moment someone is reading this file to find out what to
install. Left blank, the loudest, most deliberate failure in the whole setup
points at a table that cannot answer.

Both are ordinary dependencies. Nothing is global, and nothing is vendored into
this repository.

## 2. Materialising and re-materialising

| Command                    | What it does                                                                                                   |
| -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `devkit sync`              | Write the shipped files into this repository. A locally modified file is reported and kept, never overwritten. |
| `devkit doctor`            | Report what differs between your copies and the package, writing nothing.                                      |
| `devkit doctor --check`    | The same, failing when anything differs — the form for CI.                                                     |
| `devkit doctor --verbose`  | Also list the edits you have acknowledged, with the reason each was given.                                     |
| `devkit closure --shipped` | Measure whether the shipped set references anything it does not carry.                                         |

**Choose your profile in `devkit.config.json`, not on the command line.**
`"profile": "agent"` places the skills, the path rules, the subagent definitions,
the coordination register and the decision home; `"profile": "repo"` adds the
workflows, the git hooks, the templates and this file. `monorepo` and `full` are
the rungs above, and place what `repo` places until their content lands.

Every command accepts `--profile <name>` as a one-off, and using it is how the
two get out of step: sync the wider profile by flag, let CI run
`devkit doctor --check` without it, and every file outside the configured profile
is dropped from the plan before anything counts it — so deleting a hook or
editing a workflow reports no drift at all. Set it once in the config and the
question cannot be asked two different ways.

Two files record the result and both are **tracked** — commit them.
`.devkit-manifest.json` is what the kit last wrote, which is how an upstream fix
can be applied without destroying your edit. `.devkit-accepted.json` is the edits
you have said you meant:

```bash
devkit doctor --accept .claude/rules/routes-data.md --reason "our loaders return a different shape"
```

It takes one file at a time and refuses a path that is not currently reported as
`modified` or `conflict`, so it cannot silence something that is not a live
finding. Acknowledging a conflict does not adopt it — the package's version is
still never written over yours. The record
is keyed to that file's content — edit it again and it is reported again.

## 3. The gates

Each is a bin the gate runtime installs. They read nothing but their arguments,
their environment and the repository, so a workflow can call them after an
install and a git hook can call them from the working tree.

| Bin                        | What it checks                                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `repo-verify-commit`       | One commit message, from a file or from stdin.                                                                            |
| `repo-verify-branch`       | The branch name, from `--branch`, the environment, or the checkout.                                                       |
| `repo-verify-pr`           | A pull request's title, description and base branch.                                                                      |
| `repo-verify-issue`        | An issue description against the template.                                                                                |
| `repo-verify-claims`       | The coordination register's integrity, overlap and staleness.                                                             |
| `repo-verify-adrs`         | Decision-record placement, numbering, index freshness, and body.                                                          |
| `repo-verify-adrs --adopt` | Once, on a home that already holds records: grandfathers today's failures so only new records are held to the body rules. |
| `repo-close-claim`         | Deletes the task file(s) a merged pull request claimed.                                                                   |
| `repo-claim-board`         | Renders the register as a table, on demand.                                                                               |
| `repo-adr`                 | Scaffolds a new decision record at the next free number.                                                                  |

## 4. What this repository supplies

The materialiser substitutes your commands into the files it writes, so a shipped
file never names another repository's toolchain. They are declared once, in
`devkit.config.json`:

```json
{
  "commands": {
    "install": "npm ci",
    "check": "npm run check",
    "run": "npm run",
    "test": "npm test",
    "audit": "npm audit --audit-level=moderate"
  }
}
```

A file whose command is not configured is **not written**, and `devkit doctor`
names the key that is missing. That is deliberate: a materialised instruction
that looks like a command and is not one is worse than an absent file.

The same file also names the directories the gates read — the register, the
decision homes, the published-package roster. Every one has a conventional
default, so a repository that follows the layout configures nothing.

## 5. After a fresh sync

Three things no sync can do for you, in the order they will bite:

1. **Fill in the two package names in §1.** Every hook and workflow that fails
   for a missing gate runtime sends its reader here.
2. **Point git at the hooks.** They are materialised, executable and inert until
   you do:

   ```bash
   git config core.hooksPath .githooks
   ```

3. **Add a `.node-version`.** The workflows read it, so a repository without one
   fails its first run on the setup step — deliberately, rather than silently
   using whatever Node the runner happened to have.

Each is loud when it is missing except the first, which is why it is first.

## 6. The tasks in this repository's manifest

`devkit init` wires these into `package.json`, and every later run reconciles
them rather than leaving them as they were first written: a task this kit wrote
and you have not touched is updated in place, a task you changed is reported and
kept as you have it, and a task this kit stops shipping is removed. Your own
tasks are never touched — write them in here as you add them, so this file stays
true.

Writing in here edits a file this kit placed, so `devkit doctor` reports this
file as modified from the first task you add. Acknowledge it once —
`devkit doctor --accept COMMANDS.md --reason "our own commands"` — and read
`devkit doctor --verbose` when you upgrade: an acknowledgement holds back this
kit's own changes to the file as well as reporting yours.

They are listed rather than tabulated because the command that runs a task is
substituted from your config, and no column width fits every repository's.

A task is **wired** only where the package carrying its command is installed, so
a repository that took the materialiser and not the gate runtime gets the two
that name `devkit` and none of the rest. A task already in your manifest is
reconciled either way: what happens to be installed on the machine running the
command says nothing about what belongs in the file.

From the `agent` profile up:

- `{{commands.run}} branch:verify` — `repo-verify-branch`
- `{{commands.run}} commit:verify` — `repo-verify-commit`
- `{{commands.run}} coordination:close` — `repo-close-claim`
- `{{commands.run}} coordination:verify` — `repo-verify-claims`
- `{{commands.run}} devkit:check` — `devkit doctor --check`
- `{{commands.run}} devkit:sync` — `devkit sync`

From the `repo` profile up:

- `{{commands.run}} adr:list` — `repo-verify-adrs --list`
- `{{commands.run}} adr:new` — `repo-adr`
- `{{commands.run}} adr:verify` — `repo-verify-adrs`
- `{{commands.run}} issue:verify` — `repo-verify-issue`
- `{{commands.run}} pr:verify` — `repo-verify-pr`
- `{{commands.run}} scripts:verify` — `repo-verify-script-size`

From the `monorepo` profile up:

- `{{commands.run}} commands:verify` — `repo-verify-commands`

That last one is the gate that holds this section to its word: it fails when a
task in `package.json` is documented nowhere here, and when a task documented
here is not one this repository has. It takes the spelling from the `run` key in
§4, so it holds this file to the way **you** run a task rather than to any one
toolchain's.

It is wired only where the blueprint below is, because the section below is part
of what it reads: a repository that took the gates and not the blueprint has none
of those tasks, and would be handed a gate that was red the day it arrived. Wire
it there yourself and that section is what it will report — delete it, or take
the block.

### The blueprint's own tasks

These arrive with `devkit create` at the `monorepo` profile, alongside the
workspace layout, the dependency catalog and the lint configuration that rung
places. They are the one set no other run wires, because they name binaries only
the manifest `create` writes declares — and they are reconciled from then on
exactly like the tasks above.

- `{{commands.run}} check` — format, lint and type-check in one pass.
- `{{commands.run}} format:all` — format the tree.
- `{{commands.run}} format:check` — report formatting without writing, for CI.
- `{{commands.run}} lint:all` — both linters, fixing what can be fixed.
- `{{commands.run}} lint:biome` — the second linter alone, fixing what it can.
- `{{commands.run}} lint:biome:check` — the second linter alone, reporting only.
- `{{commands.run}} lint:check` — both linters, reporting only, for CI.
- `{{commands.run}} prepare` — regenerate the generated configs after an install.
- `{{commands.run}} test:all` — every workspace's tests, in dependency order.
- `{{commands.run}} tsconfig:generate` — rewrite the generated TypeScript configs
  and format what it wrote.
- `{{commands.run}} typecheck:all` — type-check the root, then every workspace.
