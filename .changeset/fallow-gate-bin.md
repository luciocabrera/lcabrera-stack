---
'@lcabrera/repo-standards': minor
---

Add the `repo-fallow-gate` bin. It runs one fallow analysis (`architecture`, `coverage-gaps`, `guard`, `mutation`, `security`, `similar-code` or `suppressions`) over the changed files read from stdin, or over files named on the command line as a pre-commit hook passes them, and exits non-zero on a finding. `suppressions`, `coverage-gaps` and `similar-code` exit 0 on a finding when fallow runs them directly, so the bin reads their JSON report to decide. `coverage-gaps`, `security` and `mutation` judge only what the change introduced, against the merge base in `CHANGED_FILES_BASE`: a coverage gap counts when its file is new or its export sits on a changed line, and a renamed file is not new. With no file named and stdin a terminal, the bin exits 2 rather than check nothing. `security` runs whenever any file changed, a workflow or shell script included, because it judges the changed lines itself. `mutation` runs once per workspace root so that each workspace's own test configuration resolves its imports. Changed files outside every workspace get one more run from the repository root, narrowed by a diff of those files, so a repository with no workspaces is mutated from its root alone. Every run passes `--allow-dirty`, so uncommitted changes are mutated as well. fallow is resolved from the repository's `node_modules` rather than from `PATH`, git runs with a fixed system `PATH`, and fallow is needed only when the bin runs.

`repo-verify-script-exits` no longer walks `.fallow/`. fallow keeps its run state there, including the runtime it installs for `fallow mutation`, whose scripts call `process.exit()`, so the gate failed after any mutation run.

The workspace graph the change-scoped runners read (`repo-test-changed`, `repo-run-changed`, `repo-merge-coverage`, `repo-coverage-report` and this bin) now takes each workspace's directory from the `pnpm-workspace.yaml` glob it matched. A workspace under `tools/*`, `libs/core` or a nested `packages/group/*` was looked up as `packages/<name>` before, which does not exist.

`runGitStatus` takes an optional `maxBuffer`, and its result carries `exceeded` when the output overran it.
