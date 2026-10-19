---
name: worktree-housekeeping
description: Find the git worktrees and local branches whose work has merged, show the plan, and remove them on confirmation without ever losing an uncommitted change. Use when worktrees have piled up, when a session-start line says some look removable, or when asked to clean up, prune or tidy old worktrees, agent checkouts, merged branches or throwaway test containers. Invoke as /worktree-housekeeping.
user-invocable: true
allowed-tools: Bash, Read
---

# Worktree housekeeping

An agent run that gets its own worktree leaves it behind when it finishes, and
each one holds its own dependency install. `repo-housekeeping-prune`, a bin of
the gate runtime package, sorts them along with the local branches and the
throwaway test containers. This skill runs it, shows the user the plan, and
applies it only after they say yes.

Run every command from the main checkout. A worktree cannot be removed while a
shell or a session is sitting inside it.

## 1. Read the plan

The bin reads the pull request list on stdin:

```bash
gh pr list --state all --json number,headRefName,state --limit 400 | repo-housekeeping-prune
```

If your task runner defines a `housekeeping:prune` task, it is this pipe; use
it. Run the bin through your package manager's exec if it is not on PATH. The
dry run changes nothing and prints four sections:

- **branches it would delete**: their pull request merged or closed, or they
  hold no commit the default branch lacks.
- **worktrees it would remove**: clean, on a branch whose pull request merged or
  closed, or detached on a commit the default branch contains.
- **throwaway containers it would remove**: stopped, or running for a worktree
  that is gone.
- **KEEPING**: everything that might be work. A branch with unique commits and
  no pull request, a dirty worktree, any stash.

A dirty worktree's line splits its changed files into those that match the
default branch's history, those that match the worktree's own history, those
that match neither, and the untracked ones.

The `note:` lines say what the command could not learn. Without `gh`, or
without a login it can use, nothing arrives on stdin, and every worktree whose
verdict depends on a pull request is kept and listed. Without Docker, no
container is listed.

## 2. Show it and ask

Put the plan in front of the user as printed. Name the worktrees that will be
removed and the branches that will be deleted. Do not apply anything until the
user confirms this plan, in this session.

## 3. Apply it

Run the same pipe with `--apply` after the bin. It removes the worktrees and
deletes the branches the plan listed, runs `git worktree prune`, and removes the
listed containers. If a step fails it says which one and exits 1. Run the dry
run again afterwards and show the user what is left.

A dirty worktree whose every change already exists in history, with no untracked
file, is removed only with `--apply --include-superseded`, and only after the
user agrees to it by name.

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
container itself when it is done with it. Containers without the label are
never touched.

## The session-start line

`repo-housekeeping-prune --hint` prints one line when more than ten worktrees
look removable, and nothing otherwise; `--threshold <n>` changes the number. It
reads no stdin and local refs only. A clean worktree counts when it is detached
on a commit the default branch contains, or when its branch's upstream is gone
after a fetch that pruned. It makes no network call and removes nothing, so it
is safe to run from a session-start hook. Its count is an estimate, and the plan
in step 1 is what decides.
