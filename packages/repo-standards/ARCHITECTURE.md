# `@lcabrera/repo-standards` — architecture

One spec, four commands, and the small readers they share.

| Module                                                                        | Responsibility                                                                                                                                           |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `commit-convention.mjs`                                                       | The standard itself: the grammar, the type vocabulary, the required sections, and pure validators returning `{ errors, warnings }`.                      |
| `config.mjs`                                                                  | The two repository names the messages need, read from `devkit.config.json`.                                                                              |
| `host-root.mjs`                                                               | Where "the repository" is, derived from the caller's own location.                                                                                       |
| `cli-input.mjs`                                                               | argv and stdin readers, including stepping over the separator a task runner forwards.                                                                    |
| `safe-read.mjs`, `git-dir.mjs`, `report-warnings.mjs`, `workspace-scopes.mjs` | Reading a file inside the repository, locating the git directory, printing non-blocking hints, deriving the scope vocabulary from `pnpm-workspace.yaml`. |
| `coordination-read.mjs`, `coordination-parse.mjs`                             | The register entries the pull-request gate consults for declared shared branches.                                                                        |
| `verify-*.mjs`                                                                | The four commands. Effects at the edges; every decision comes from the pure validators.                                                                  |

## Two decisions worth not undoing

**The scope vocabulary is derived, not listed.** `workspace-scopes.mjs` reads
`pnpm-workspace.yaml`, so the commit and PR scopes self-update when a workspace
is added. A hardcoded list is the thing that rots.

**Nothing here asserts which repository it is running in.** The default branch
and the shared-branch directory are arguments with documented defaults. That is
the whole difference between a standard and this repository's standard, and it is
why a check that compares a repo script against this spec — the branch-type
drift check — lives in the repository's own suite rather than here.
