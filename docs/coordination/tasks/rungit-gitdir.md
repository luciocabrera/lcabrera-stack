---
id: rungit-gitdir
title: runGit inherits GIT_DIR so cwd is ignored
owner: agent:claude
status: review
branch: rungit-gitdir
area:
  - packages/scan-ingestion/src/ingestion/git/**
started: 2026-07-22
updated: 2026-07-22
plan: (none)
pr: #263
issue: #258
---

## What

`runGit` spread the ambient environment into its child process, carrying
`GIT_DIR` through. Git reads that in preference to the working directory, so
the `cwd` argument was advisory: under any `GIT_DIR`-exporting parent — which
means anything run from a git hook — the call answered for the wrong
repository instead of failing.

Fixed by building the child environment explicitly (`buildGitChildEnv`), which
strips the seven variables that can name a repository and keeps the rest.

## Note for review

The first regression test written for this was **vacuous**, in exactly the way
the original test was: it pointed `GIT_DIR` at `${process.cwd()}/.git`, which
under vitest is the workspace directory and holds no `.git`. Git failed because
the variable named nothing, so the assertion passed with the bug fully present.
The test now builds a real throwaway repository, and a fifth test asserts that
repository actually leaks through an inherited environment — so the guard
cannot silently stop guarding.

## Status / next

- Complete; gate green, and both regression tests verified to fail with the fix
  reverted. Awaiting review on #263.
