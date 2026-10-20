---
'@lcabrera/repo-standards': minor
---

`repo-housekeeping-prune` now judges a dirty worktree by content. Its line in the plan counts the changed files whose content matches the default branch's history, the worktree's own history, or neither, plus its untracked files. With `--apply --include-superseded` it removes a dirty worktree only when none match neither and nothing is untracked; no flag removes one holding a change found in neither history. Without the flag a dirty worktree is still only reported.

A clean worktree detached on a commit the default branch contains is now removed, a locked worktree is kept, and a clean worktree removed in a run no longer stops that run from deleting its merged branch; a superseded one keeps its branch. `--apply` runs `git worktree prune` before deleting any branch, so a branch a stale entry still names is deleted as planned, and the dry run lists those stale entries under their own heading. The checkout the command runs from is never touched.

The plan also lists containers labelled `devkit.throwaway`, whose value names the worktree that started them. `--apply` removes a stopped one, and a running one whose worktree is gone; a running one whose worktree is still there is listed under KEEPING with that reason. Without Docker it lists none and says so. When no pull request list arrives on stdin, every worktree whose verdict needs one is listed as kept, with a note saying why.

New `--hint [--threshold <n>]` mode: one line when more than `n` worktrees (ten by default) look removable from local refs alone, naming the `gh pr list … | repo-housekeeping-prune` pipe that prints the full plan. It reads no stdin, calls neither `gh` nor Docker, and removes nothing, so a session-start hook can run it.
