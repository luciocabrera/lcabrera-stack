#!/usr/bin/env sh
# Remove git's per-invocation environment before a hook runs repo tasks.
#
# Git exports GIT_DIR (and friends) to every hook, and every process the hook
# spawns inherits them. Those variables OVERRIDE the working directory: a `git`
# command run with `cwd` set to somewhere else entirely still operates on the
# repository GIT_DIR names. Anything a hook runs — a test suite most of all —
# therefore talks to the developer's real repository no matter where it thinks
# it is pointing.
#
# That is not hypothetical. `readGitMetadata.util.test.ts` builds a throwaway
# repository in a temp directory:
#
#   execFileSync('git', ['init', '--initial-branch=main'], { cwd: repoPath });
#   execFileSync('git', ['add', '.'], { cwd: repoPath });
#
# Run from a shell that is exactly right. Run from inside the pre-push hook, the
# inherited GIT_DIR wins: `git init` re-initialises the real repository
# ("warning: re-init: ignored --initial-branch=main"), and `git add .` — which
# has staged deletions as well as additions since Git 2.0 — sees an empty
# directory as the work tree and stages the removal of every tracked file. The
# index goes from 3644 entries to 1.
#
# HEAD is untouched, so `git log` and `git show` look perfectly normal and
# nothing complains. The damage only becomes visible at the *next* commit, which
# writes a near-empty tree and deletes most of the repository. Two commits were
# lost that way before the cause was found; both looked like a clean
# `git add <file> && git commit`.
#
# Unsetting these is safe for everything this repo runs in a hook: no task needs
# to know which ref is being pushed, and `git` then resolves the repository from
# the working directory exactly as it does in a normal shell. That also makes the
# hook behave identically in a linked worktree, where the inherited GIT_DIR points
# at the shared common directory rather than the worktree's own.
#
# Sourced by .vite-hooks/pre-push. Keep it sourced rather than executed — a child
# process cannot unset a parent's environment.
#
# Deliberately NOT sourced by pre-commit. That hook only runs `vp staged`, which
# lints staged files and spawns no test suite, so it cannot hit this. It is also
# the one hook where GIT_INDEX_FILE can legitimately point at a temporary index
# git built for the commit in progress; unsetting it there would silently switch
# `vp staged` to a different index than the one being committed. Scrub where the
# risk is, not everywhere.
# The seven repository-selecting variables are the same set
# a `buildGitChildEnv.util.ts` strips for one caller; this protects everything a
# hook spawns. Keep the two lists in step.
# GIT_CEILING_DIRECTORIES and GIT_DISCOVERY_ACROSS_FILESYSTEM are deliberately
# absent from both: they only ever make discovery stricter.
unset GIT_ALTERNATE_OBJECT_DIRECTORIES
unset GIT_COMMON_DIR
unset GIT_DIR
unset GIT_INDEX_FILE
unset GIT_NAMESPACE
unset GIT_OBJECT_DIRECTORY
unset GIT_WORK_TREE

# Not repository-selecting, but hook-specific and misleading to inherit:
# GIT_PREFIX names the subdirectory git was invoked from, and GIT_QUARANTINE_PATH
# points at a temporary object store that vanishes when the hook returns.
unset GIT_PREFIX
unset GIT_QUARANTINE_PATH
