---
id: reviewer-own-identity
title: give the in-workflow reviewer its own identity
owner: agent:claude
status: active
branch: chore/865-reviewer-own-identity
area:
  - .github/workflows/claude-review.yml
  - .github/workflows/copilot-review-gate.yml
  - scripts/lib/copilot-review*
  - scripts/lib/claude-review-workflow.test.mjs
  - scripts/lib/workflow-inspect.mjs
  - docs/tooling/copilot-review-gate.md
started: 2026-08-21
updated: 2026-08-21
plan: (none)
pr: '#866'
issue: #865
---

## What

Post the in-workflow review under the Claude General Reviewer GitHub App instead of
the default `GITHUB_TOKEN`, and accept that login instead of `github-actions`.

## Status / next

- Current step: implemented; measuring on the PR whether an App-authored review wakes
  `copilot-review-gate.yml` on its own, which the GITHUB_TOKEN one structurally could not
- Blockers: none
- Next: record the measurement, then merge

## Overlap with `gate-runtime-family-four` — checked, not a conflict

`coordination:verify` warns that this task and `gate-runtime-family-four`
(`feat/798-gate-runtime-family-four`) both claim `scripts/lib/**`. That is their glob's
breadth, not a shared file. Verified rather than assumed:

```
comm -12 <(git diff --name-only origin/main...origin/feat/798-gate-runtime-family-four | sort)          <(git diff --name-only origin/main...HEAD | sort)
```

returns nothing. Their `scripts/lib/` work is `renamed-mentions.mjs` and
`stray-configs.mjs`; this task's is `copilot-review*`. Neither branch touches a file the
other does, so there is nothing to serialise. Re-run the command before assuming that
still holds — it is a fact about two diffs, not a standing property.
