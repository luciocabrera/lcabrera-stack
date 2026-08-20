# Commands

What the installed kit provides, and what this repository has to supply for it.
Your own build, test and release commands belong here too — add them below and
keep this file true, because it is the first thing a new agent reads.

## 1. The two packages

| Package          | What it is                                                                         |
| ---------------- | ---------------------------------------------------------------------------------- |
| the materialiser | Puts the shipped files where they are discovered by path, and reports drift.       |
| the gate runtime | The checks, as commands: commit messages, branch names, PRs, issues, the register. |

The materialiser is invoked as `devkit`. The gate runtime installs one bin per
check; each is named in the table below. Both are ordinary dependencies — nothing
is global, and nothing is vendored into this repository.

## 2. Materialising and re-materialising

| Command                      | What it does                                                                                                   |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `devkit sync`                | Write the shipped files into this repository. A locally modified file is reported and kept, never overwritten. |
| `devkit sync --profile full` | The same, plus the workflows, hooks, templates and registers.                                                  |
| `devkit doctor`              | Report what differs between your copies and the package, writing nothing.                                      |
| `devkit doctor --check`      | The same, failing when anything differs — the form for CI.                                                     |
| `devkit doctor --verbose`    | Also list the edits you have acknowledged, with the reason each was given.                                     |
| `devkit closure --shipped`   | Measure whether the shipped set references anything it does not carry.                                         |

Two files record the result and both are **tracked** — commit them.
`.devkit-manifest.json` is what the kit last wrote, which is how an upstream fix
can be applied without destroying your edit. `.devkit-accepted.json` is the edits
you have said you meant:

```bash
devkit doctor --accept .claude/rules/routes-data.md --reason "our loaders return a different shape"
```

It takes one file at a time and refuses a path that is not currently reported as
modified, so it cannot silence something that is not a live finding. The record
is keyed to that file's content — edit it again and it is reported again.

## 3. The gates

Each is a bin the gate runtime installs. They read nothing but their arguments,
their environment and the repository, so a workflow can call them after an
install and a git hook can call them from the working tree.

| Bin                  | What it checks                                                      |
| -------------------- | ------------------------------------------------------------------- |
| `repo-verify-commit` | One commit message, from a file or from stdin.                      |
| `repo-verify-branch` | The branch name, from `--branch`, the environment, or the checkout. |
| `repo-verify-pr`     | A pull request's title, description and base branch.                |
| `repo-verify-issue`  | An issue description against the template.                          |
| `repo-verify-claims` | The coordination register's integrity, overlap and staleness.       |
| `repo-verify-adrs`   | Decision-record placement, numbering and index freshness.           |
| `repo-close-claim`   | Deletes the task file(s) a merged pull request claimed.             |
| `repo-claim-board`   | Renders the register as a table, on demand.                         |
| `repo-adr`           | Scaffolds a new decision record at the next free number.            |

## 4. What this repository supplies

The materialiser substitutes your commands into the files it writes, so a shipped
file never names another repository's toolchain. They are declared once, in
`devkit.config.json`:

```json
{
  "commands": {
    "install": "npm ci",
    "check": "npm run check",
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

Two things are not files, so nothing can materialise them:

```bash
git config core.hooksPath .githooks
```

points git at the seeded hooks — without it they sit there and never run. And the
workflows read `.node-version`, so a repository without one fails its first run
on the setup step rather than silently using whatever the runner had.
