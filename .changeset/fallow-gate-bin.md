---
'@lcabrera/repo-standards': minor
---

Add the `repo-fallow-gate` bin. It runs one fallow analysis (`architecture`, `coverage-gaps`, `guard`, `mutation`, `security`, `similar-code` or `suppressions`) over the changed files read from stdin, or over files named on the command line as a pre-commit hook passes them, and exits non-zero on a finding. `suppressions`, `coverage-gaps` and `similar-code` exit 0 on a finding when fallow runs them directly, so the bin reads their JSON report to decide. `coverage-gaps`, `security` and `mutation` judge only what the change introduced, against the merge base in `CHANGED_FILES_BASE`: a coverage gap counts when its file is new or its export sits on a changed line. `mutation` runs once per workspace root so that each workspace's own test configuration resolves its imports. fallow is resolved from `PATH` and is needed only when the bin runs.

`repo-verify-script-exits` no longer walks `.fallow/`. fallow keeps its run state there, including the runtime it installs for `fallow mutation`, whose scripts call `process.exit()`, so the gate failed after any mutation run.
