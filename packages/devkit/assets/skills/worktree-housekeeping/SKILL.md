---
name: worktree-housekeeping
description: Find the git worktrees whose work has merged or been abandoned, show the plan, and remove them on confirmation without ever losing an uncommitted change. Use when worktrees have piled up, when a session-start line says some look removable, or when asked to clean up, prune or tidy old worktrees, agent checkouts or throwaway test containers. Invoke as /worktree-housekeeping.
user-invocable: true
allowed-tools: Bash, Read
---

# Worktree housekeeping

An agent run that gets its own worktree leaves it behind when it finishes, and
each one holds its own dependency install. `devkit worktrees` sorts them. This
skill runs it, shows the user the plan, and applies it only after they say yes.

Run every command from the main checkout. A worktree cannot be removed while a
shell or a session is sitting inside it.

## 1. Read the plan

```bash
devkit worktrees
```

Run it through your package manager's exec if `devkit` is not on PATH. It
changes nothing, and prints one line per linked worktree:

| Verdict                  | When                                                                                                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `remove + delete branch` | Clean, and its branch's pull request merged with the commits the branch still holds.                                                                                            |
| `remove`                 | Clean, and the pull request closed unmerged or there is none (the branch is kept), or detached on a commit the default branch contains or on the head of a merged pull request. |
| `keep`                   | An open pull request, a locked worktree, a pull request state nobody could read, or any uncommitted change.                                                                     |

A dirty worktree is never removed by default. Its line splits the changed files
into those that match the default branch's history, those that match the
worktree's own history, those that match neither, and the untracked ones.

The `note:` lines at the end say what the command could not learn. Without `gh`,
or without a login it can use, every worktree whose verdict depends on a pull
request is kept. Without Docker, no container is listed. Pass `--base <ref>`
when the default branch cannot be found.

## 2. Show it and ask

Put the plan in front of the user as printed. Name the worktrees that will be
removed and the branches that will be deleted. Do not apply anything until the
user confirms this plan, in this session.

## 3. Apply it

```bash
devkit worktrees --apply
```

It removes exactly the worktrees the plan listed, deletes exactly the branches
it listed, runs `git worktree prune`, and removes stopped or orphaned throwaway
containers. If a step fails it says which one and exits 1. Run the plan again
afterwards and show the user what is left.

A dirty worktree whose every change already exists in history, with no untracked
file, is removed only with both flags, and only after the user agrees to it by
name:

```bash
devkit worktrees --apply --include-superseded
```

Nothing removes a worktree with a change that matches neither history. No flag
does, and you must not do it by hand either.

## 4. Report what stays

For each dirty worktree that is still there, save what it holds before you
report it, so the user can read it without opening the worktree:

```bash
dir="$(git rev-parse --git-common-dir)/worktree-patches"
mkdir -p "$dir"
git -C <worktree> diff --binary HEAD > "$dir/<worktree name>.patch"
git -C <worktree> ls-files --others --exclude-standard > "$dir/<worktree name>.untracked"
```

Then tell the user, per worktree: its path and branch, how many files match
neither history, which files they are, how many untracked files there are, and
the path of the saved patch. Do not commit, stash, reset or discard anything in
it. Those are the user's decisions.

## Throwaway containers

The command lists containers carrying the `devkit.throwaway` label. Its value is
the absolute path of the worktree that started the container, so an agent
starting one passes `--label devkit.throwaway=<that path>`, and removes the
container itself when it is done with it.

A stopped container, and a running one whose worktree is gone, are removed by
`--apply`. A running container whose worktree still exists is kept. Containers
without the label are never touched.

## The session-start line

`devkit worktrees --hint` prints one line when more than ten worktrees look
removable, and nothing otherwise; `--threshold <n>` changes the number. It
reads local refs only. A clean worktree counts when it is detached on a commit
the default branch contains, or when its branch's upstream is gone after a fetch
that pruned. It makes no network call and removes nothing, so it is safe to run
from a session-start hook. Its count is an estimate, and the plan in step 1 is
what decides.
