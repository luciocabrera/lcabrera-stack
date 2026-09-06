# `@lcabrera/repo-standards` — architecture

One spec, a set of commands, and the small readers they share.

| Module                                                                                                                              | Responsibility                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `commit-convention.mjs`                                                                                                             | The standard itself: the grammar, the type vocabulary, the required sections, and pure validators returning `{ errors, warnings }`.                                                                                                                               |
| `config.mjs`, `config-tree-gates.mjs`                                                                                               | The repository facts the gates read from `devkit.config.json`: names, register directories, baselines, report paths and workspace rosters.                                                                                                                        |
| `host-root.mjs`                                                                                                                     | Where "the repository" is, derived from the caller's own location.                                                                                                                                                                                                |
| `cli-input.mjs`                                                                                                                     | argv and stdin readers, including stepping over the separator a task runner forwards.                                                                                                                                                                             |
| `safe-read.mjs`, `git-dir.mjs`, `report-warnings.mjs`, `workspace-scopes.mjs`                                                       | Reading a file inside the repository, locating the git directory, printing non-blocking hints, deriving the scope vocabulary from `pnpm-workspace.yaml`.                                                                                                          |
| `coordination-read.mjs`, `coordination-parse.mjs`                                                                                   | The register entries the pull-request gate consults for declared shared branches.                                                                                                                                                                                 |
| `shipped-docs.mjs`                                                                                                                  | Whether a document in a packed tarball reads with only that package on disk — the inverse of the documented-path question.                                                                                                                                        |
| `gh-exec.mjs`, `review-gate-status.mjs`, `merge-queue.mjs`, `review-gate-reconcile.mjs`, `pr-threads-api.mjs`, `review-threads.mjs` | The code-host plumbing: running `gh`, resolving which pull request and commit a run answers for (inside a merge queue too), and publishing a status against the head that was read.                                                                               |
| `affected-tests.mjs`, `changed-runner.mjs`, `public-package-dirs.mjs`                                                               | The change-scoped runners: which workspaces a diff touched plus their dependents, and the never-baseline package roster.                                                                                                                                          |
| `doc-registers.mjs`, `doc-register-*.mjs`, `ci-commands.mjs`                                                                        | The requirement and planning registers: schema, reader, checks and reports, and which tasks CI runs.                                                                                                                                                              |
| `conformance-*.cjs`                                                                                                                 | The harness readers behind `repo-verify-harness`: roster, frontmatter, references, triggers, report.                                                                                                                                                              |
| `usage-*.mjs`                                                                                                                       | The harness usage report's sources, window, snapshot and rendering.                                                                                                                                                                                               |
| the remaining one-gate cores                                                                                                        | `departed-names`, `deps-audit`, `renamed-mentions`, `script-exit-calls`, `eslint-pass-probe`, `viteplus-block`, `worktree-env`, `inventory-drift`, `lint-plugins`, `package-app-references`, `route-artifacts`, `housekeeping-plan`, `jsonc`: pure, one bin each. |
| `verify-*.mjs` and the other bins                                                                                                   | The commands. Effects at the edges; every decision comes from the pure modules above.                                                                                                                                                                             |

## Two decisions worth not undoing

**The scope vocabulary is derived, not listed.** `workspace-scopes.mjs` reads
`pnpm-workspace.yaml`, so the commit and PR scopes self-update when a workspace
is added. A hardcoded list is the thing that rots.

**A host's own scripts reach the shared modules by relative path, and the
modules reachable that way import nothing but node builtins and siblings.** The
workflows that run a repository's review gates do not install, and the sweep that
detects a gate editing itself walks relative imports. Both are why `gh-exec`,
`review-gate-status`, `merge-queue`, `review-gate-reconcile`, `review-threads`,
`public-package-dirs`, `jsonc` and the `conformance-*` readers are exported and
also importable by path, and why none of them may gain a bare dependency.

**Nothing here asserts which repository it is running in.** The default branch
and the shared-branch directory are arguments with documented defaults. That is
the whole difference between a standard and this repository's standard, and it is
why a check that compares a repo script against this spec — the branch-type
drift check — lives in the repository's own suite rather than here.
