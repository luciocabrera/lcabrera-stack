# @repo/repo-standards

The gates that keep a repository's commits, branches, pull requests and issues to
one enforced shape — as commands, so a repository that installs this package can
run them.

Private while the first family is being proved here. It publishes as
`@lcabrera/repo-standards`
([ADR-081](../../docs/decisions/ADR-081-ship-the-repo-setup-as-two-packages.md)).

## Why a package rather than scripts

The skills that describe how work gets done shell out to these gates. A consumer
who materialises `commit-and-pr` and has no `commit-convention.mjs` gets prose
whose first instruction names a file they do not have. This is the half that has
to be **resolved** from `node_modules` rather than copied — it is code, invoked
by name, and copying it would put it outside node's resolution graph where no
upgrade can reach it.

## Commands

| Bin                                          | Checks                                                |
| -------------------------------------------- | ----------------------------------------------------- |
| `repo-verify-commit <file>`                  | a commit message against the Conventional Commit spec |
| `repo-verify-branch [name]`                  | a branch name against the same type vocabulary        |
| `repo-verify-pr --title <t> --body-file <f>` | a pull request's title and every required section     |
| `repo-verify-issue --body-file <f>`          | an issue body's required sections                     |

In this repository they are `vp run commit:verify`, `branch:verify`, `pr:verify`
and `issue:verify`.

## Configuration

`devkit.config.json` at the repository root, all of it optional:

```json
{
  "conventions": {
    "defaultBranch": "main",
    "sharedBranchesDir": "docs/coordination/branches"
  }
}
```

Only these two are repository data: a gate that says "retarget to `main`" tells a
repository with a differently-named default branch something false, and one that
names a register directory names a path a consumer may not have. Everything else
— the type vocabulary, the required sections, the grammar — is the standard
itself and travels unchanged.

The file is shared with `@repo/devkit`, because it is the consumer's data and two
files would drift. The readers are separate: each package reads only the block it
owns, so neither depends on the other to answer a question about its own
behaviour.

## The one thing to know before moving a file here

These gates find the repository by walking up from their own location, not by
counting directories. Counting worked while they lived at the repository root and
broke the moment they moved into a workspace — the guard that refuses to read a
file outside the repository began treating the package directory as the
repository and refused every legitimate path. See `host-root.mjs`.
