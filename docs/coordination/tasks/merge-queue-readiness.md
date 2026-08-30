---
id: merge-queue-readiness
title: Make the repository ready for a GitHub merge queue on main
owner: agent:claude
status: active
branch: ci/1034-merge-queue-readiness
area:
  - .github/workflows/**
  - scripts/pr-queue-operator.mjs
  - scripts/resolve-subject-pr.mjs
  - scripts/sonar-report*
  - scripts/copilot-review-status.mjs
  - scripts/lib/pr-queue-*
  - scripts/lib/merge-queue*
  - scripts/lib/review-gate-status.mjs
  - .claude/pr-queue-policy.md
  - docs/agents/merge-checklist.md
  - docs/agents/epic-orchestration.md
  - docs/tooling/merge-queue.md
  - docs/tooling/copilot-review-gate.md
  - docs/decisions/ADR-097-*
  - docs/README.md
  - COMMANDS.md
started: 2026-08-30
updated: 2026-08-30
plan: (none)
pr: #1038
issue: #1034
---

## What

Make the repository ready for a GitHub merge queue on `main` (#1034): every
workflow producing a required context reports on `merge_group`, every diff-scoped
gate takes its base from the merge group's parent commit, and the PR queue
operator enqueues instead of merging. The ruleset change itself is written down
for the owner to apply, not applied here — enabling the queue before this lands
blocks every merge.

## Status / next

- Current step: review round 5 — the leash refuses the three remaining routes
  that name themselves (a `git push` whose destination refspec is `main`, the
  git-refs endpoint and its GraphQL twins, `enqueuePullRequest`), and every copy
  of the claim now says what a decision-time deny-list over free text can
  structurally do: bound what may be authorised, best-effort. Containment is the
  apply pass's tool list, which is #1040
- Blockers: none. The `docs/decisions/**` overlap warning against
  grouped-column-scope (#1033) is real and already resolved by content: that
  branch took ADR-096, so this one is ADR-097. The glob here is a single file and
  cannot be narrowed further.
- Next: the owner applies the `merge_queue` rule to ruleset 19141543 (payload and
  the drop of `SonarCloud Code Analysis` are in `docs/tooling/merge-queue.md`),
  then runs the #1034 two-PR repro against the live queue. #1034 stays open until
  both are done, which is why this PR references it without a closing keyword.
- Follow-up raised, not done here: #1040 — `forbiddenActions` bounds the decision
  the operator audits, not the apply pass's own tool list
