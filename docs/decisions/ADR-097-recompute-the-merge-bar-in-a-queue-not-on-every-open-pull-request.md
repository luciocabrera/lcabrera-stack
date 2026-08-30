---
governs:
  - repository
---

# ADR-097 — Recompute the merge bar in a queue, not on every open pull request

**Status:** Accepted

**Date:** 2026-08-30
**Issue:** [#1034](https://github.com/luciocabrera/lcabrera-stack/issues/1034)
**Relates to:** [ADR-075](./ADR-075-the-index-does-not-list-the-adrs.md)

## Context

A required status check on a pull request is evaluated against a merge commit
built when the check ran. Ruleset `19141543` sets
`strict_required_status_checks_policy: false`, so nothing recomputes it when the
base moves. A pull request can sit fully green against a `main` that no longer
exists, and merge.

That is harmless for a check that reads only the diff. It is not harmless for the
gates that read the **whole tree** — `adr:verify`, `docs:verify`,
`renames:verify`, `commands:verify`, `inventory:verify`, `suppressions:verify` —
each of which can pass on a pull request and fail on `main` after an unrelated
merge, because the thing it objects to arrived from the other side.

It nearly landed on 2026-08-28. #1027 and #1024 each added an ADR numbered 094
with a different slug. Different filenames, so git merged clean and GitHub
reported `MERGEABLE`; `adr:verify` passed on each branch because it reads one
tree. #724 was the inverse case and was loud, because both pull requests appended
a row to a generated index — ADR-075 deleted that index, and with nothing shared
left to conflict on, a number collision now produces no git-level signal at all.

The constraint that decided this: `main` took 259 commits in the 14 days to
2026-08-28, about 25 merges a day (`git log --since='14 days ago' --oneline
origin/main | wc -l`).

## Options considered

1. **`strict_required_status_checks_policy: true`.** One line, and it covers
   gates nobody has written yet. Rejected on the merge rate: it makes every merge
   to `main` invalidate every other open pull request and force an update, so a
   pull request can starve in an update / re-run CI / someone-else-merged loop.
   Concurrency is one to three open pull requests today, so it would work now and
   get worse exactly as the repository gets busier. Buying a fix that fails under
   load is worse than buying one that costs more up front.
2. **Re-run only the whole-tree gates when the base moves.** Cheapest in CI time.
   Rejected on shape: it needs a hand-maintained list of which gates read the
   whole tree, and a list is the failure this repository keeps paying for — the
   suppression rosters, the gate's stage list, the operator's leash. A gate whose
   correctness depends on someone remembering to add a line is what #993 spent
   eleven rounds removing.
3. **A GitHub merge queue. Chosen.** It builds the real merge result — the live
   base, plus every entry ahead in the queue, plus this pull request — runs the
   required checks against that, and merges only if they pass. It is the property
   the issue asks for, obtained without touching any open pull request.

## Decision

`main` requires a merge queue, and the repository is built for it.

- Every workflow producing a required context carries the `merge_group` trigger.
  A merge queue dispatches `merge_group`, and a workflow without it never reports
  inside the queue, so the queue waits for a check that never arrives with
  nothing saying why. Which contexts those are is read from the ruleset, never
  from a list in a document — `docs/tooling/merge-queue.md` gives the command.
- `SonarCloud Code Analysis` is **not** one of them and comes off the required
  list. It is the SonarCloud app's own check, not a workflow here, and SonarCloud
  runs in Automatic Analysis mode: it analyses `main` and pull requests only, so a
  `gh-readonly-queue/…` branch gets no analysis and no check. `Strict Sonar issue
gate` already covers it and more — `--gate` fails on the same SonarCloud
  quality gate, `--fail-on-issues` fails on any open issue, which the app's
  rating-based gate does not.
- Inside the queue every diff-scoped gate takes its base from
  `github.event.merge_group.base_sha`, documented as the merge group's parent
  commit — so the diff is this pull request's own change against the tree it will
  land on. `check-safe.yml` resolves it once into `DIFF_BASE`.
- The pull request a queue build answers for is resolved from the queue branch's
  ref by `scripts/resolve-subject-pr.mjs`, which fails rather than defaulting.
  `Commit + PR standards`, `Strict Sonar issue gate` and `Copilot review
complete` all read what it exports, so neither event has its own copy of "what
  is being checked".
- `Copilot review complete` is a commit status on the pull request head, which
  the queue never reads. Its workflow publishes the same verdict about the same
  head on the merge group's commit.
- The merge step stops being a merge. `gh pr merge <n> --squash` enqueues where a
  queue is required and squash-merges where one is not, and it is the only way of
  landing a pull request the operator may authorise. `forbiddenActions` is shaped
  in two halves, because the two halves of the problem are opposite. The **flags**
  of `gh pr merge` are a closed vocabulary, so that half is an **allow-list**: the
  one authorised form passes and every other is refused. A deny-list of flags was
  tried first and leaked four times in one review round — it named `--merge` and
  `--rebase` while gh also spells them `-m` and `-r`, and named the
  `enablePullRequestAutoMerge` mutation while `--auto` calls the same mutation
  from the CLI. Which **transport** writes `main` is open (gh, `curl`, `git`
  itself), so that half stays a deny-list keyed on the operation's shape — the
  REST `PUT …/pulls/{n}/merge`, `POST …/merges` and `…/git/refs` endpoints, the
  `mergePullRequest` / `enablePullRequestAutoMerge` / `mergeBranch` /
  `enqueuePullRequest` / `updateRef` / `createCommitOnBranch` mutations, and a
  `git push` whose destination refspec is `main` — with the endpoints' path
  segments matched unread, so a shell variable standing in for the number is the
  same endpoint. **That half is best-effort and cannot be complete**: see the
  consequence below, which states what it is rather than what it sounds like. The
  operator's `MERGE` verdict is renamed `ENQUEUE`, a queued pull request is
  `WAIT` (E11) rather than something to act on, and closing the issue, deleting
  the branch and pruning the worktree move to a later pass that observes
  `state: MERGED`.
- A queue ejection gets its own signal. The failing checks belong to the merge
  group's commit, so the pull request's own required checks stay green and every
  rollup probe reads it as ready. `isInMergeQueue` and the
  `RemovedFromMergeQueueEvent` timeline entry are the only places it is recorded;
  the operator reads both (policy S11).

Applying the ruleset itself is deliberately not part of this change: enabling the
queue before the workflows are on `main` blocks every merge. The exact edit is in
`docs/tooling/merge-queue.md`.

That leaves a window in which the workflows are on `main` and the queue is not,
and **the mitigation the queue replaces still has to hold in it**. So every
surface that changes behaviour branches on `isMergeQueueEnabled` rather than on
this ADR being merged: E10 in the operator, and the rebase-the-wave step in
`docs/agents/epic-orchestration.md` Phase 4 — which is the workflow the #1034
near-miss actually happened in, and where deleting the rebase early would have
made the repository worse than before this change.

## Consequences

**What it costs.**

- Every merge now runs CI twice: once on the pull request and once in the queue.
  That is the price of recomputing against the real base, and it is paid per
  merge rather than per open pull request, which is why it survives the merge
  rate that killed option 1.
- A merge is asynchronous. A tool or a person that asked for one cannot conclude
  it happened, and anything conditional on the merge — closing the issue,
  deleting the branch, pruning the worktree — has to observe `state: MERGED`
  instead. Every such surface had to be found and changed; missing one would have
  left an autonomous operator deleting a branch whose work had not landed.
- A pull request can now fail in a place its own checks do not show. That is the
  ejection case above, and it is a new failure mode that did not exist before —
  mitigated by S11, not removed by it.
- The required-contexts list is now load-bearing in a second way: adding a
  required context whose workflow lacks `merge_group` does not fail loudly, it
  hangs the queue. Nothing mechanical prevents that today.
- **The leash gained shapes but not a layer, and the shapes are not the point.**
  `forbiddenActions` refuses the routes to `main` that name themselves in plain
  text — every form of `gh pr merge` but the authorised one, the REST merge,
  branch-merge and git-refs endpoints, the merge, enqueue and ref mutations, and
  a `git push` whose destination refspec is `main`. It **cannot** refuse every
  route, because a deny-list over free text does not see an operation whose text
  does not name it: a path or a ref held entirely in a variable, a script file, an
  encoded string, or a spelling nobody has written down. The evidence that this is
  a general property and not a gap to be closed is the history of this guard —
  four missed spellings in one review round, three more in the next, each found by
  reading rather than by the guard. So the honest claim is the narrow one: it
  bounds, best-effort, what the decide pass may **authorise**, in the decision
  text that is the audited artifact. **A decision-time audit is not containment.**
  It cannot constrain the apply pass, whose tool list admits `Bash(gh api:*)` for
  A4 and S11 and `Bash(git:*)` for A1, and which no prefix allow-list can restrict
  to reads because gh's method is a flag and a push destination is an argument.
  #1040 is that containment and does not exist yet; until it lands, the operator's
  log is a record of what was authorised, not a guarantee of what ran.
- The allow-list half costs a false ESCALATE on any `gh pr merge` the model
  writes in another shape: an extra flag (`--repo` included), and the two other
  spellings of `<n>` that gh accepts — `#42` and the pull request's URL — because
  the authorised form matches a bare decimal. That is the direction a leash should
  fail in, and the refusal names the authorised form, so the next pass writes it.
  It also means a decision whose action text merely _quotes_ the landing command
  inside another command escalates; the same was already true of `--admin`.
- The push shape costs nothing on ordinary work and is worth stating why: A1
  pushes the head branch and A7 deletes it, and neither names `main` as a
  destination, so `git push --force-with-lease origin <head>` and
  `git push origin --delete <head>` pass unchanged. A push that reaches `main`
  without naming it — a refspec in a variable, a configured `push.default` —
  is not seen, which is the same residual as everything else in this half.
- Not every shape it now refuses is reachable. `--auto` needs auto-merge enabled
  on the repository and this one has it off, so on 2026-08-30 the flag failed
  rather than merging. It is refused because it is the same operation as a
  mutation already refused, and because a leash whose coverage depends on a
  repository setting staying put is not one — not because a live bypass was
  found.
- One required context is lost outright (`SonarCloud Code Analysis`), and with it
  the backstop the strict gate's timeout-skip relied on. That is why the queue
  run passes `--require-analysis`: latency may skip the check for an author, it
  may not skip it in front of a merge.

**What it buys.** The whole-tree gates are true of the commit that lands, for
every gate including ones not written yet, without any open pull request being
touched or rebased.

## Alternatives considered

Both losing options are in **Options considered** above, each with the evidence
that decided it — the merge rate for strict checks, and this repository's own
history with hand-maintained lists for the narrow re-run.

One narrower alternative was rejected inside the chosen design: keeping
`SonarCloud Code Analysis` required and accepting whatever the queue did with it.
Rejected because the two outcomes are indistinguishable from the outside — a
context that never reports and a context that is slow both read as `Expected` —
and the failure mode is the whole queue stopping.

## References

- [#1034](https://github.com/luciocabrera/lcabrera-stack/issues/1034) — the
  defect, the reproduction, and the owner's decision comment naming the queue
- [`docs/tooling/merge-queue.md`](../tooling/merge-queue.md) — the operational
  half: the ruleset payload, what each gate diffs against, how to read an
  ejection
- [ADR-075](./ADR-075-the-index-does-not-list-the-adrs.md) — deleting the ADR
  index, which removed the last git-level signal for a number collision
- [`.claude/pr-queue-policy.md`](../../.claude/pr-queue-policy.md) — E10, E11,
  A5–A8 and S11, the operator's side of this
- GitHub, "Managing a merge queue" — the `merge_group` requirement, the
  `gh-readonly-queue/{base_branch}` prefix for third-party CI, and the grouping
  strategies
