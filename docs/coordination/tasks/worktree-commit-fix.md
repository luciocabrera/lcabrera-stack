---
id: worktree-commit-fix
title: 'fix(tooling): let the commit-msg hook read a worktree COMMIT_EDITMSG'
owner: agent:claude
status: active
branch: fix/worktree-commit-msg
area:
  - scripts/lib/safe-read.mjs
  - scripts/lib/git-dir.mjs
  - scripts/verify-commit-msg.mjs
started: 2026-07-21
updated: 2026-07-21
plan: (none)
pr: (none)
issue: #164
---

## What

Every commit made from a linked git worktree failed the `commit-msg` hook,
because `readTextWithin` refused the `COMMIT_EDITMSG` path git hands it — in a
worktree that file lives under `<primary>/.git/worktrees/<name>/`, outside the
working tree the check anchors on.

That made worktree isolation unusable: `vp run coordination:claim --worktree`
could not complete, and the only workaround was `--no-verify`, which skips the
whole pre-commit and commit-msg gate rather than just this check.

The fix resolves the checkout's git directory (`scripts/lib/git-dir.mjs`, no
subprocess) and admits it as an additional allowed root for that one read, so
the traversal guard stays strict.

## Status / next

- Current step: fix implemented, self-test added, verified end-to-end from a
  linked worktree
- Blockers: none
- Next: open the PR
