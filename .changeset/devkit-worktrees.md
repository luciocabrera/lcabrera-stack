---
'@lcabrera/devkit': minor
---

New `devkit worktrees` command. It sorts every linked worktree into remove or keep and prints the plan without changing anything. `--apply` carries out exactly that plan and then runs `git worktree prune`. A clean worktree whose branch's pull request merged is removed with its local branch. One whose pull request closed unmerged, or that has none, is removed and its branch kept. One with an open pull request is kept, and so is a clean detached worktree unless the default branch contains its commit or a merged pull request had it as its head. A dirty worktree is never removed by default. The plan counts how many of its changed files match the default branch's history, its own history, or neither, and `--include-superseded` removes it only when none match neither and nothing is untracked. Pull request state comes from `gh`. Without it, every worktree whose verdict depends on that state is kept, and the plan says why.

The command also lists containers labelled `devkit.throwaway`. `--apply` removes a stopped one, and a running one whose labelled worktree is gone. Without Docker it lists none and says so.

`devkit worktrees --hint [--threshold <n>]` prints one line when more than `n` worktrees (ten by default) look removable from local refs alone. It makes no network call and removes nothing, so a session-start hook can run it.

The package now also ships a `worktree-housekeeping` skill that runs the plan, applies it once the user confirms, and saves a patch for each dirty worktree it leaves in place. `devkit sync` places it with the other skills.
