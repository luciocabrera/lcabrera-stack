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

## What recomputes it

`opened`, `reopened`, `synchronize`, `ready_for_review`, `converted_to_draft`,
and any review `submitted` or `dismissed`. `synchronize` is the load-bearing
one: it fires on every push, the new head has no review yet, and the status
therefore goes `pending` inside that run.

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

## Known limitation: fork pull requests

A pull request from a fork gets a read-only `GITHUB_TOKEN`, so no commit status
can be published from its run. The workflow detects this, prints the verdict it
would have posted, and emits a warning rather than failing opaquely on a 403.
The check is then **absent** on that PR — fail-closed, and break-glass step 3 or
4 is the way through. This repository is single-owner, so the case is rare by
construction; it is documented so that it is understood rather than discovered.

## Preconditions these notes depend on

Everything above describes the repository **after** #694 added
`copilot_code_review` (with `review_on_push: true`,
`review_draft_pull_requests: false`) and `pull_request` to ruleset `19141543`,
and after this gate's workflow is on `main`. Two consequences of that second
precondition are worth stating, because they make the gate behave differently on
the pull request that introduces it than it will afterwards:

- Workflows for events other than `pull_request` run from the **default branch**,
  so the `pull_request_review` half of the trigger starts working only once the
  workflow file is on `main`. Before then only the `pull_request` half fires,
  which is enough to show `pending` on every push but not to show the flip to
  `success`.
- Until #698, nothing merges or fails on what this status says.

Re-read this section before treating a quiet gate as a broken one.
