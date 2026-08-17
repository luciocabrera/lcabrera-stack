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
and any review `submitted` or `dismissed` — that is what it subscribes to, which
is not the same as what gets delivered, and the review half mostly is not (see
the known limitation below). `synchronize` is the load-bearing one: it fires on
every push, the new head has no review yet, and the status therefore goes
`pending` inside that run.

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

## When the status stays pending

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

### Which `pending` is this?

Answer this before picking a rung, because the two answers need opposite actions
and **the status text does not separate them** — it says whatever the last run
that executed computed, so a review that landed after that run is nowhere in it.

- **Copilot has not reviewed this head yet** → wait. Nothing is wrong.
- **Copilot has reviewed this head and nothing recomputed** → act. The status is
  not waiting for anything; it is stale, and it stays stale until something runs.

One command answers it, from a checkout, posting nothing:

```bash
vp run copilot-review:status -- --pr <n> --dry-run
```

`success` from that while the pull request shows `pending` is the stale case: the
review is in and only the status is behind, so nothing needs re-requesting.
Without a checkout, compare the head against Copilot's newest review directly:

```bash
gh pr view <n> --json headRefOid --jq '.headRefOid[0:8]'
gh api repos/luciocabrera/vite-react-compiler/pulls/<n>/reviews \
  --jq 'map(select(.user.login|test("[Cc]opilot")))|last|"\(.commit_id[0:8]) \(.submitted_at)"'
```

The same SHA on both lines, with the pull request showing `pending`, is stale.
The third reading — the gate would publish `pending` while the pull request shows
`success` — is in
[`review-gate-reconcile.md`](./review-gate-reconcile.md#telling-not-reviewed-yet-from-reviewed-but-not-recomputed),
which owns the full table.

### Break-glass

Ordered by what it costs the author, cheapest first, and each rung says which of
the two cases above it is for — a rung aimed at the wrong one is not merely
useless, and rung 5 makes things worse.

**Before any of them:** in the stale case the scheduled sweep corrects the status
within one interval with nobody doing anything, so these rungs are for when that
is too long, or when the sweep is not running. Check rather than assume —

```bash
gh run list --workflow=review-gate-reconcile.yml --limit 5
```

— because a workflow reads `active` in `gh workflow list` from the moment its
file lands on `main`, whether or not a scheduled run has ever happened.
[`review-gate-reconcile.md`](./review-gate-reconcile.md) has the interval and the
rest of the preconditions.

1. **Reply to any review thread** — for the stale case, and the cheapest thing
   that works: no push access, no checkout, no new commit, and usually an action
   you were taking anyway while working through the findings.

   A reply is a **review**, not a comment: it arrives as
   `pull_request_review.submitted` from a human actor, and human-submitted
   reviews have fired an executing run every time this has been measured
   (#737 §1). Use the Reply box on a thread, or the endpoint behind it:

   ```bash
   gh api repos/luciocabrera/vite-react-compiler/pulls/<n>/comments/<comment-id>/replies \
     -f body='<text>'
   ```

   `gh pr comment` is **not** this. A plain pull request comment is an
   `issue_comment`, which this workflow does not listen to — see its `on:` block;
   the agent-review gate is the one that does.

   Observed end to end on #726 at head `81659dff`, 2026-08-15: Copilot reviewed
   at 08:35:28Z and no run appeared; two thread replies at 08:46:26Z and 08:46:27Z each
   created a review (the reply comments carry `in_reply_to_id`, and
   `pull_request_review_id` `4943392944`/`4943392963` are those two reviews),
   each fired a run two seconds later, both `success`, and the status read
   `success` at 08:46:35Z.

   **It needs a thread to reply to.** A pull request with every thread resolved,
   or one Copilot reviewed with no findings, has nothing to reply to — take rung 2.

2. **Re-run the gate's own run for the current head** — the stale case again,
   and the rung that needs neither a thread nor a checkout. Find the run by head
   SHA, then re-run it:

   ```bash
   gh run list --workflow=copilot-review-gate.yml --limit 20 \
     --json databaseId,headSha,event,createdAt \
     --jq '.[]|select(.headSha|startswith("<head-sha>"))|"\(.databaseId) \(.event) \(.createdAt)"'
   gh run rerun <id>
   ```

   Any run on that head will do, whatever event created it. A re-run replays the
   original event payload, and the only things the job reads out of it are the
   pull request number and whether the head repository is a fork — the script
   re-reads the head and the reviews from the API, so it publishes what is true
   now rather than what the first attempt saw. Observed on #738 at head
   `cdd4371d`, 2026-08-17: the push's own run (`32013243743`) published `pending`
   at 09:02:48Z, Copilot reviewed at 09:07:21Z and created no run, and re-running
   that same run published `success` at 09:40:51Z — a different verdict out of
   the same run, which is only possible because it re-derived it. It works on a
   run held at `action_required` too: run `31946902341` (#738, head `2b97fb7f`)
   was created by Copilot's review on 2026-08-16 and never executed; its second
   attempt, the next morning, did, and published. **Approve and run** from the
   Checks tab is the same effect from the UI.

   Two traps, both walked into in this repository:

   - **Do not take "the latest run".** Several sessions work this repository at
     once, so `--limit 1` picks up whichever pull request pushed last, and
     re-running it recomputes _that_ pull request's status. Select by head SHA.
   - **Re-run the run, not the workflow.** `gh run rerun` needs nothing on the
     default branch. `gh workflow run` resolves the workflow **file** against the
     default branch and 404s while it is not there yet; the measured version of
     that rule is in
     [`review-gate-reconcile.md`](./review-gate-reconcile.md#recovery-when-the-status-is-wrong-right-now).

3. **Recompute it directly** — the stale case again, and the rung to use when
   there is no run on that head to re-run:

   ```bash
   vp run review-gates:reconcile -- --pr <n>          # from a checkout
   gh workflow run copilot-review-gate.yml -f pr=<n>  # or from Actions
   ```

   Both re-derive the verdict rather than asserting one, so neither leaves a
   status a later reader cannot reproduce — which is what separates them from
   rung 6. The local form posts as you and leaves no workflow run behind: on #738
   head `bd1b475a` (2026-08-17) the `success` that cleared a missing recompute shows as
   `creator: luciocabrera` with no `target_url` under
   `gh api repos/luciocabrera/vite-react-compiler/commits/<sha>/statuses`, which
   is how to tell a local recompute from a workflow one afterwards.

4. **Re-request the review** from the pull request's Reviewers panel — for the
   **other** case, a head Copilot has not reviewed at all. This is what unstuck
   #671, and it is still the right move there.

   **It does not clear a stale status.** `review_requested` is not one of the
   `pull_request` types this workflow listens to, so the request recomputes
   nothing by itself; what it eventually produces is another Copilot review,
   which is exactly the delivery that usually goes missing (next section). Aimed
   at a stale status it costs a review and changes nothing.

5. **Push an empty commit**
   (`git commit --allow-empty -m "chore: re-request review"`) — also for the
   unreviewed case: `review_on_push: true` requests a fresh review on the new
   head, and `synchronize` re-reports the status.

   **Against a stale status it moves the stall instead of clearing it**, which is
   worse than doing nothing, because the author believes they have acted. The run
   does fire and does execute — and publishes `pending` for the new head, which
   no review names yet, while the review it requests is the same delivery that
   went missing. Observed on #738, 2026-08-17: `bd1b475a` was pushed and reported
   `pending` at 08:55:51Z, Copilot reviewed it at 08:59:57Z, no run appeared, and
   it was still `pending`; the next push repeated the shape on `cdd4371d`. The
   review that had already landed is superseded as well.

6. **Publish the status by hand.** Requires push access; the reason goes in the
   description and in a PR comment, because a hand-posted `success` is the one
   state nobody can re-derive later.

   ```bash
   gh api --method POST repos/luciocabrera/vite-react-compiler/statuses/<head-sha> \
     -f state=success -f 'context=Copilot review complete' \
     -f 'description=break-glass: <reason>'
   ```

   This is the same call the workflow makes. It is overwritten by the next event
   the workflow handles, so post it once the head has settled.

7. **Admin bypass of the ruleset**, once #698 has made the context required.
   `RepositoryRole` 5 keeps `bypass_mode: always` on ruleset `19141543`.

## Known limitation: a Copilot review usually does not recompute this status

**Most `pull_request_review` events submitted by Copilot never reach this
workflow — no run is created at all — and the ones that do create a run held at
`action_required` until a maintainer releases it.** Either way, the review that
should flip the status to `success` does not, on its own, run the job that would.
Human-submitted reviews on the same pull requests fire runs that execute, which
is what rung 1 uses.

That is the shape of every case measured here, not a law: the split moves as pull
requests land, and one Copilot review that executed unattended would change what
the ladder is for. So no ratio is written down, and the commands are here instead
— #737 §1 carries this method and the sample it was first taken on:

```bash
gh run list --workflow=copilot-review-gate.yml --limit 60 \
  --json event,headSha,createdAt,conclusion \
  --jq '.[]|select(.event=="pull_request_review")|"\(.headSha[0:8]) \(.createdAt) \(.conclusion)"'
gh api repos/luciocabrera/vite-react-compiler/pulls/<n>/reviews \
  --jq '.[]|"\(.user.login) \(.commit_id[0:8]) \(.submitted_at)"'
```

Match each Copilot review against the runs on the same head. Three ways that
check reports a healthy trigger while the status is stale:

- **A row is not an execution.** Read `conclusion`: an `action_required` run was
  created and never ran.
- **A run on the head need not be _your_ review's.** Compare the review's
  `submitted_at` with the run's `createdAt`. On #738 head `bd1b475a`
  (2026-08-17) a run created at 08:56:15Z concluded `success` while Copilot
  reviewed at 08:59:57Z —
  that run belonged to a human review submitted at 08:56:13Z, and Copilot's fired
  nothing.
- **A conclusion is the latest attempt's.** A run someone re-ran reads `success`
  even when the attempt the review created was held. Run `31895693848` — the one
  #737 §1 counted as having executed — reads `success`, and its first attempt is
  `action_required` while its second was triggered by a human;
  `gh api repos/luciocabrera/vite-react-compiler/actions/runs/<id>/attempts/1`
  is what says which. Anything counting reviews whose run executed has to read
  attempt 1, or it counts a human's re-run as a working trigger.

Where a run **is** created and held, the approval policy explains it. Measured on
#707, two review events on the same head commit minutes apart:

| Review submitted by | Run conclusion    |
| ------------------- | ----------------- |
| `Copilot`           | `action_required` |
| `luciocabrera`      | `success`         |

Only the reviewer differs, so the reviewer is what moved it — a run that failed
for some property of the workflow or the branch would have failed for both. The
repository's Actions approval policy at the time of that reading was
`first_time_contributors`
(`gh api repos/luciocabrera/vite-react-compiler/actions/permissions/fork-pr-contributor-approval`),
and the `Copilot` bot is not a contributor to this repository. What that does not
explain is the majority case, where there is no run to approve; that cause is
undetermined and belongs to **#698**.

Consequences while this stands:

- The status still goes `pending` on every push, and still reports on every
  `pull_request` event. Nothing false is ever published, so this is a
  **liveness** failure and not a soundness one — the gate is never green when it
  should be red, it is late when it should be green. What it costs is that
  `pending` means two different things, which is why the ladder starts by asking
  which one you are looking at.
- It reaches `success` when the **next** handled recompute happens — the next
  push, a human review, a released or re-run job, or the scheduled reconcile. It
  does not reach `success` on the Copilot review alone.
- The `failure` state, which needs a Copilot review to have executed the job, is
  therefore rare in practice. `pending` is what a stale review reports instead,
  and `pending` also blocks.

The ways out are the break-glass ladder above, and waiting for the reconcile is
the one that costs nothing. The reconcile
([ADR-076](../decisions/ADR-076-reconcile-the-review-gate-statuses-on-a-schedule.md))
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
Copilot reviews the head, exactly as for any other pull request. The last two
break-glass rungs — the hand-posted status, and the admin bypass — remain the way
through if it is needed sooner.

## Preconditions these notes depend on

Everything above describes the repository **after** #694 added
`copilot_code_review` (with `review_on_push: true`,
`review_draft_pull_requests: false`) and `pull_request` to ruleset `19141543`.
Further things the notes assume:

- **Until #698, nothing merges or fails on what this status says.** It is
  advisory, which is why the approval limitation above is a nuisance today and a
  blocker the day the context becomes required.
- **The Actions approval policy is `first_time_contributors`.** Loosen it and a
  Copilot-triggered run executes on its own, which changes the table in that
  section; tighten it and more actors are gated the same way. Re-read the setting
  before trusting either reading.
- **The scheduled reconcile is running.** Everything above that says a stale
  status corrects itself assumes it is. GitHub disables `schedule` triggers after
  60 days of repository inactivity, so `gh workflow list` says whether this one
  is still active — and
  `gh run list --workflow=review-gate-reconcile.yml --limit 5` says whether it
  has actually run, which is the question. A workflow reads `active` from the
  moment its file lands on `main`, before any scheduled run has happened, and
  that reads exactly like one that is sweeping.

One expectation the measurements **disproved**, recorded so it is not
re-inherited: the `pull_request_review` half was expected to be inert until the
workflow file reached `main`, on the general rule that non-`pull_request` events
run workflows from the default branch. The review-triggered runs on #707 came
from the pull request's own branch
(`head_branch: ci/695-copilot-review-complete-check`) on 2026-08-14, while the
workflow file did not reach `main` until `4660e05f` the next morning — so on this
event GitHub used the branch's copy, and could not have used any other.
Re-derive it with

```bash
git log --format='%h %ad' --date=short main -- .github/workflows/copilot-review-gate.yml
gh api '/repos/luciocabrera/vite-react-compiler/actions/workflows/copilot-review-gate.yml/runs?per_page=100' \
  --jq '.workflow_runs[]|select(.event=="pull_request_review")|"\(.created_at) \(.head_branch) \(.conclusion)"'
```

Re-read this section before treating a quiet gate as a broken one.
