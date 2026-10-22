---
'@lcabrera/devkit': minor
---

New `worktree-housekeeping` skill, placed with the other skills. It runs the gate runtime's `repo-housekeeping-prune` with the pull request list on stdin, shows the plan, applies it once the user confirms, and saves a patch for each dirty worktree it leaves in place. It needs `@lcabrera/repo-standards` 0.10.0 or later. An older `repo-housekeeping-prune` ignores the flags it does not know: `--apply` still carries out that release's narrower plan, without superseded worktrees, detached worktrees on the default branch or containers, and `--include-superseded` changes nothing. `--hint` is ignored too, so the bin waits for a pull request list on stdin and then prints a full dry run instead of the one-line count.
