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
  - scripts/lib/sonar-wait*
  - scripts/copilot-review-status.mjs
  - scripts/lib/pr-queue-*
  - scripts/lib/merge-queue*
  - scripts/lib/review-gate-status.mjs
  - .claude/pr-queue-policy.md
  - docs/agents/merge-checklist.md
  - docs/agents/epic-orchestration.md
  - docs/tooling/merge-queue.md
  - docs/tooling/copilot-review-gate.md
  - docs/decisions/ADR-098-*
  - docs/README.md
  - COMMANDS.md
  - .github/skills/lint-toolchain/SKILL.md
started: 2026-08-30
updated: 2026-08-31
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

- Current step: review round 9 — the rename of the operator's `MERGE` verdict to
  `ENQUEUE` left `isWithinCeiling` ranking the proposed verdict with
  `indexOf`, and an absent value has no position: `-1 <= anything` read every
  unrecognised verdict as within every ceiling, not only the old spelling. The
  vocabulary is now declared once (`PRECEDENCE` in `pr-queue-gate.mjs`), the
  ceiling refuses a value outside it on either side, the decide pass's JSON
  schema derives its enum from it, and `parseDecision` refuses a response
  carrying one — which routes it through `failedDecision` to `ESCALATE` under
  S10 instead of a row `applyDecisions` skips and the log counts in no column
- Round 7 — `COMMANDS.md` was the last surface still saying
  A6-A8 happen on "a later pass that sees it merged", and its `--apply` row still
  ended "enqueue, close". Both now say what the code does. The leash is settled
  (round 5, residual routed to #1040) and the Sonar wait compares the commit
  SonarCloud says it analysed for the pull request against this run's head,
  instead of hunting for a recent Compute Engine task in a project-wide window
  that an older pull request falls out of
- How the A6-A8 surface set was closed, so a ninth one does not surface next
  round. Four rounds each corrected the surfaces the previous round named, which
  is why a new one kept appearing; this one enumerates them from the tree
  instead. Every tracked file is grepped for the claim's own vocabulary, and each
  hit is read against `scripts/lib/pr-queue-github.mjs` and
  `scripts/pr-queue-operator.mjs` rather than against a sibling document:

  ```bash
  git ls-files -z '*.md' '*.mjs' '*.yml' '*.ts' |
    xargs -0 grep -nIiE -e 'clos(e|es|ing) the (linked )?issue' \
      -e 'delet(e|es|ing) the (head )?branch' -e 'prun(e|es|ing) the worktree' \
      -e 'remove the worktree' -e '(later|another|next) pass' \
      -e 'sees it merged' -e 'once merged' -e 'after the merge' --
  ```

  Every hit it returns is one of three things. The **operator lane**, which now
  says the three are unowned: `.claude/pr-queue-policy.md` §1 and §4, ADR-098's
  consequences, `docs/tooling/merge-queue.md`, the apply prompt in
  `scripts/lib/pr-queue-execute.mjs`, and `COMMANDS.md`. The **by-hand lane**,
  which correctly waits on `state: MERGED` before doing any of them:
  `docs/agents/merge-checklist.md` and `docs/agents/epic-orchestration.md`
  Phase 4. Or a hit about something else entirely — the `ACT` verdict and the
  review-gate reconcile sweep re-evaluating next pass, S10 refusing to defer a
  failed run, the decision log's diffable form, the `releasing` skill's label
  step, a `housekeeping:prune` test name. A reader checks that classification by
  re-running the grep, not by taking it

- Blockers: none. The `docs/decisions/**` overlap warning against
  grouped-column-scope (#1033) is real and already resolved by content, twice:
  that branch took ADR-096, then the fold-control branch (#1042) merged ADR-097
  while this one was in review, so this one renumbered to ADR-098. The glob here
  is a single file and cannot be narrowed further.
- Next: the owner applies the `merge_queue` rule to ruleset 19141543 (payload and
  the drop of `SonarCloud Code Analysis` are in `docs/tooling/merge-queue.md`),
  then runs the #1034 two-PR repro against the live queue. #1034 stays open until
  both are done, which is why this PR references it without a closing keyword.
- Follow-ups raised, not done here: #1040 — `forbiddenActions` bounds the decision
  the operator audits, not the apply pass's own tool list; #1043 — the operator
  reads open pull requests only, so nothing observes `state: MERGED` and A6-A8
  (close the issue, delete the branch, prune the worktree) have no owner while a
  queue is required
