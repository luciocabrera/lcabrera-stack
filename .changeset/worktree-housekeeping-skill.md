---
'@lcabrera/devkit': minor
---

New `worktree-housekeeping` skill, placed with the other skills. It runs the gate runtime's `repo-housekeeping-prune` with the pull request list on stdin, shows the plan, applies it once the user confirms, and saves a patch for each dirty worktree it leaves in place. Its flags `--include-superseded` and `--hint` need the `@lcabrera/repo-standards` release that adds them; an older release ignores them and prints a dry run.
