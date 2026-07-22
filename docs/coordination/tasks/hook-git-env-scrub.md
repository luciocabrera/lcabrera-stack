---
id: hook-git-env-scrub
title: Stop a failed push destroying the git index
owner: agent:claude
status: review
branch: fix-hook-git-env
area:
  - .vite-hooks/**
  - packages/scan-ingestion/src/ingestion/git/readGitMetadata.util.test.ts
  - scripts/lib/git-env-scrub.test.mjs
started: 2026-07-22
updated: 2026-07-22
plan: (none)
pr: (none)
issue: #269
---

## What

Git exports `GIT_DIR` to every hook, and it outranks the working directory for
every `git` a hook spawns. The pre-push hook runs the test suite, and a fixture
there builds a throwaway repo with `git init` + `git add .` — which under the
hook re-initialises the real repository and stages the deletion of every tracked
file. The index goes from 3644 entries to 1, `HEAD` is untouched so nothing looks
wrong, and the next commit writes a near-empty tree.

Fixed in two layers: the hook scrubs the repository-selecting variables before
running anything, and the fixture builds its own child environment. Also clears
the three `scan-ingestion` failures that were forcing `--no-verify` on pushes.

## Status / next

- Current step: gate green; corruption reproduced, then verified fixed —
  index 3644 → 3644 with `GIT_DIR` set, hook exit 0
- Blockers: none
- Next: merge. Worth landing ahead of other work — every agent pushing to this
  repo is exposed until it does.
