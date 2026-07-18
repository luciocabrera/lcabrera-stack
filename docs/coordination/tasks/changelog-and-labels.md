---
id: changelog-and-labels
title: Changelog generator + PR auto-labels (app/pkg/type), from the commit convention
owner: agent:claude
status: review
branch: feat/changelog-and-labels
area:
  - scripts/generate-changelog.mjs
  - scripts/sync-labels.mjs
  - scripts/pr-labels.mjs
  - scripts/lib/labels.mjs
  - scripts/lib/git-remote.mjs
  - CHANGELOG.md
  - .github/workflows/labeler.yml
  - .github/workflows/changelog.yml
started: 2026-07-18
updated: 2026-07-18
plan: we-want-to-have-greedy-parrot.md
pr: https://github.com/luciocabrera/vite-react-compiler/pull/40
---

## What

Two additions that fall out of the enforced commit convention (PR #39), stacked
on `feat/commit-pr-standards`:

1. **Changelog** — `scripts/generate-changelog.mjs` groups Conventional-Commit
   history by type (Features / Bug Fixes / …), sub-labelled by scope, with commit
   links and breaking-change callouts, into `CHANGELOG.md` (`changelog:generate`).
   A `.github/workflows/changelog.yml` publishes per-release notes on `v*` tags.
2. **Labels** — a canonical `app:`/`pkg:`/`type:` + `breaking-change` label set
   (`scripts/sync-labels.mjs`, run against the GitHub API), and a
   `.github/workflows/labeler.yml` that auto-labels every PR: scope labels from the
   changed workspaces, type label from the PR title (`scripts/pr-labels.mjs`).

Reuses the commit-convention spec (adds a `parseCommitHeader` export) and the
workspace derivation (adds a `deriveWorkspaces` with app/pkg kind) — additive edits
to files owned by the `commit-pr-standards` task (same owner), not re-scoped here.

## Status / next

- Current step: scaffolding on the stacked branch.
- Blockers: depends on PR #39 landing the commit-convention spec (green).
- Next: helpers → changelog → labels → docs → gate → stacked draft PR.
