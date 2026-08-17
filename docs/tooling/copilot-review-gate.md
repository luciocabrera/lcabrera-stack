# The `Copilot review complete` gate

**What it asserts:** Copilot's newest review names the pull request's **current
head commit**. Nothing weaker — "Copilot has reviewed this PR at some point" is
the state that let #671 look fully reviewed while two later pushes had been seen
by nobody.

A review is attached to the commit it reviewed, and GitHub renders a completed
review the same way whether or not that commit is still the head. Requiring
conversation resolution (ruleset `19141543`, added by #694) does not close this:
every thread from an old review can be resolved while the newest commit has had
no review at all.

| Piece                                                                                          | What it is                                                    |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| [`.github/workflows/copilot-review-gate.yml`](../../.github/workflows/copilot-review-gate.yml) | when it recomputes                                            |
| [`scripts/copilot-review-status.mjs`](../../scripts/copilot-review-status.mjs)                 | the I/O — reads the PR, posts the status                      |
| [`scripts/lib/copilot-review.mjs`](../../scripts/lib/copilot-review.mjs)                       | the comparison, pure and unit-tested                          |
| [`review-gate-reconcile.md`](./review-gate-reconcile.md)                                       | the sweep that recomputes it when the event does not          |
| `vp run copilot-review:status -- --pr <n> --dry-run`                                           | what the gate would say about a PR right now, posting nothing |

## The states

The status is published against the head SHA under the context
`Copilot review complete`. The name is the whole interface — ruleset contexts
match by name, so renaming it detaches the gate silently.

For the same reason the workflow's **job** is deliberately called something
else. A job's check run and a commit status share one namespace on a pull
request, so a job named after the status would publish a second check under that
name which is green whenever the workflow merely ran — and once #698 makes the
context required, that is the one that could satisfy it.

| State     | When                                                                           |
| --------- | ------------------------------------------------------------------------------ |
| `success` | Copilot's newest submitted review names the head commit                        |
| `pending` | it does not, and a review may still arrive                                     |
| `failure` | Copilot has just submitted a review and it names something other than the head |

`failure` is narrow on purpose. Pending means "waiting is enough"; a review that
lands against a superseded commit is the one case where waiting provably is not,
because Copilot has already spoken and nothing further happens on its own. That
is #671's exact shape.

Dismissed and still-unsubmitted reviews are not counted, and an unrecognised
review state is not counted either — the comparison is whitelisted so an
unfamiliar payload leaves the gate pending rather than passing it.

### Reading it out of a status rollup

Anything that classifies a pull request's checks programmatically — the PR queue
operator, a board view, an agent deciding whether a PR is ready — must handle
this one carefully, because **its normal waiting state is easy to misread as a
failure**. In a `statusCheckRollup` it appears as a legacy status context, not a
check run:

```json
{
  "__typename": "StatusContext",
  "context": "Copilot review complete",
  "state": "PENDING"
}
```

Two traps in that payload:

- **There is no `status` field**, only `state`, and `state` is
  `PENDING | SUCCESS | FAILURE | ERROR | EXPECTED`. A consumer that reads "a
  non-null verdict means the check has finished" — the shape a `CheckRun` has,
  where `status` says finished and `conclusion` says how — classifies `PENDING`
  as a finished, non-success check. Treat `PENDING` and `EXPECTED` as
  **in flight**; terminality comes from the value being one of the terminal
  states, never from it merely being present.
- **`gh` reports an in-flight check run's `conclusion` as `""`, not `null`**, so
  an emptiness test on the neighbouring check runs has to cover both.

This is not hypothetical: it misfired on this gate's own pull request.

## What recomputes it

`opened`, `reopened`, `synchronize`, `ready_for_review`, `converted_to_draft`,
and any review `submitted` or `dismissed`. `synchronize` is the load-bearing
one: it fires on every push, the new head has no review yet, and the status
therefore goes `pending` inside that run.

Three things recompute it that are not events on this pull request:

- **The scheduled reconcile**, half-hourly over every open pull request. The
  review events are not delivered reliably here, and this is the recompute path
  that does not depend on them — see
  [`review-gate-reconcile.md`](./review-gate-reconcile.md) for the interval, the
  failure behaviour, and why a sweep is not the polling the workflow header
  rejects (#737, [ADR-076](../decisions/ADR-076-reconcile-the-review-gate-statuses-on-a-schedule.md)).
- **`workflow_dispatch`**, given a pull request number — the same recompute for
  one pull request, attributed to whoever pressed it.
- **`vp run copilot-review:status -- --pr <n>`**, which is the same script.

The run reads the head **and** the reviews from the API and posts against the
head it read, never against the SHA in the event payload. Two runs racing then
agree instead of publishing verdicts about different commits, which is why the
workflow has no `concurrency` group — cancelling a superseded run would leave an
event with no status at all.

This gate reports; it does not yet block. Promotion to a required context on
`main` is #698, deliberately separate: a required check that has never reported
blocks every pull request, including the one that would fix it.

## When Copilot never reviews

The status stays `pending`. That is the design — an absent verdict must not read
as a pass — and it is also the hazard, so the ways out are written down here
rather than improvised.

Two ordinary cases are not failures:

- **Draft pull requests.** Ruleset `19141543` sets
  `review_draft_pull_requests: false`, so Copilot does not review a draft. The
  status says so, and a draft cannot merge anyway. Marking it ready requests the
  review (measured on #702: `ready_for_review` and `review_requested` one second
  apart, with nobody asking).
- **A review already in flight.** `pending` between a push and the re-review is
  the window this gate exists to make visible, not a fault.

### Break-glass

In order — reach for the last only when the ones above genuinely do not apply.

1. **Re-request the review** from the pull request's Reviewers panel. This is
   what unstuck #671.
2. **Push an empty commit** (`git commit --allow-empty -m "chore: re-request review"`).
   The ruleset's `review_on_push: true` requests a fresh review on the new head,
   and `synchronize` re-reports the status.
3. **Publish the status by hand.** Requires push access; the reason goes in the
   description and in a PR comment, because a hand-posted `success` is the one
   state nobody can re-derive later.

   ```bash
   gh api --method POST repos/luciocabrera/vite-react-compiler/statuses/<head-sha> \
     -f state=success -f 'context=Copilot review complete' \
     -f 'description=break-glass: <reason>'
   ```

   This is the same call the workflow makes. It is overwritten by the next event
   the workflow handles, so post it once the head has settled.

4. **Admin bypass of the ruleset**, once #698 has made the context required.
   `RepositoryRole` 5 keeps `bypass_mode: always` on ruleset `19141543`.

### When the review landed and the status did not move

A separate case from the ladder above, and the common one: Copilot **has**
reviewed the head, and the event that should have recomputed the status never
produced a workflow run. The status is not waiting for anything; it is stale.

Tell the two apart before acting — the ladder's rungs all assume the review has
not happened yet:

```bash
vp run copilot-review:status -- --pr <n> --dry-run
```

If that prints `success` while the pull request shows `pending`, the review is in
and only the status is behind. Nothing needs re-requesting. Either wait for the
scheduled reconcile (half-hourly), or recompute it now:

```bash
vp run review-gates:reconcile -- --pr <n>      # from a checkout
gh workflow run copilot-review-gate.yml -f pr=<n>   # or from Actions
```

Both re-derive the verdict rather than asserting one, so neither leaves a status
a later reader cannot reproduce — which is what separates them from rung 3.
[`review-gate-reconcile.md`](./review-gate-reconcile.md) has the full table and
the preconditions.

## Known limitation: a Copilot-triggered run waits for approval

**A `pull_request_review` submitted by Copilot creates a workflow run that a
maintainer has to approve before it executes.** So the review that should flip
this status to `success` does not, on its own, run the job that would.

Measured on #707, two review events on the same head commit minutes apart:

| Review submitted by | Run conclusion    |
| ------------------- | ----------------- |
| `Copilot`           | `action_required` |
| `luciocabrera`      | `success`         |

Only the reviewer differs, so the reviewer is what moved it — a run that failed
for some property of the workflow or the branch would have failed for both. The
repository's Actions approval policy at the time of that reading was
`first_time_contributors`
(`gh api repos/luciocabrera/vite-react-compiler/actions/permissions/fork-pr-contributor-approval`),
and the `Copilot` bot is not a contributor to this repository.

A held run is not the whole story, and the wider measurement is in **#737**: most
Copilot reviews here create **no run at all**, so approval explains only a
minority of the cases. Read `conclusion`, not merely that a run row exists.

Consequences while this stands:

- The status still goes `pending` on every push, and still reports on every
  `pull_request` event. Nothing false is ever published.
- It reaches `success` when the **next** handled recompute happens — the next
  push, a human review, an approved run, or the scheduled reconcile. It does not
  reach `success` on the Copilot review alone.
- The `failure` state, which needs a Copilot review to have executed the job, is
  therefore rare in practice. `pending` is what a stale review reports instead,
  and `pending` also blocks.

Ways out, cheapest first: **wait for the reconcile**, which corrects it within
one interval without anybody doing anything; approve the waiting run from the
PR's Checks tab; recompute it now with `vp run review-gates:reconcile -- --pr <n>`
or a `workflow_dispatch`; push (including an empty commit); or break-glass step 3
above. The reconcile ([ADR-076](../decisions/ADR-076-reconcile-the-review-gate-statuses-on-a-schedule.md))
removes the _consequence_, not the cause — the durable fix for the held runs is a
repository Actions setting rather than a change to this workflow, so it belongs
with the other configuration decisions in **#698**, and a workflow that
auto-approved its own gated runs would be a much worse thing to own.

## Known limitation: fork pull requests

A pull request from a fork gets a read-only `GITHUB_TOKEN`, so no commit status
can be published from **its own** run. The workflow detects this, prints the
verdict it would have posted, and emits a warning rather than failing opaquely on
a 403. This repository is single-owner, so the case is rare by construction; it is
documented so that it is understood rather than discovered.

The scheduled reconcile is not subject to this — it runs from the default branch
with a token that can write statuses, so a fork pull request does get a status
from it, within one interval. That is the same verdict the fork's own run
computed and could not post, so nothing weaker is being asserted: `pending` until
Copilot reviews the head, exactly as for any other pull request. Break-glass step
3 or 4 remains the way through if it is needed sooner.

## Preconditions these notes depend on

Everything above describes the repository **after** #694 added
`copilot_code_review` (with `review_on_push: true`,
`review_draft_pull_requests: false`) and `pull_request` to ruleset `19141543`.
Two further things the notes assume:

- **Until #698, nothing merges or fails on what this status says.** It is
  advisory, which is why the approval limitation above is a nuisance today and a
  blocker the day the context becomes required.
- **The Actions approval policy is `first_time_contributors`.** Loosen it and the
  Copilot-triggered run executes on its own, which changes the table in that
  section; tighten it and more actors are gated the same way. Re-read the setting
  before trusting either reading.
- **The scheduled reconcile is running.** Everything above that says a stale
  status corrects itself assumes it is. GitHub disables `schedule` triggers after
  60 days of repository inactivity; `gh workflow list` says whether this one is
  still active.

One expectation the measurements **disproved**, recorded so it is not
re-inherited: the `pull_request_review` half was expected to be inert until the
workflow file reached `main`, on the general rule that non-`pull_request` events
run workflows from the default branch. Both review-triggered runs on #707 came
from the pull request's own branch
(`head_branch: ci/695-copilot-review-complete-check`) while `main` had no such
file, so on this event GitHub used the branch's copy.

Re-read this section before treating a quiet gate as a broken one.
