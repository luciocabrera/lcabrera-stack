# The review-gate reconcile

**What it is:** a scheduled sweep that republishes both review-gate commit
statuses — `Copilot review complete` and `Agent review verdict` — for every open
pull request, so that a status left stale by an event that never arrived corrects
itself without anybody noticing it was stale.

| Piece                                                                                              | What it is                                               |
| -------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| [`.github/workflows/review-gate-reconcile.yml`](../../.github/workflows/review-gate-reconcile.yml) | the schedule, the dispatch, and what it does on failure  |
| [`scripts/reconcile-review-gates.mjs`](../../scripts/reconcile-review-gates.mjs)                   | the sweep — lists open pull requests, runs both gates    |
| [`scripts/lib/review-gate-reconcile.mjs`](../../scripts/lib/review-gate-reconcile.mjs)             | the two decisions, pure and unit-tested                  |
| `vp run review-gates:reconcile`                                                                    | the same sweep by hand                                   |
| `vp run review-gates:reconcile -- --pr <n> --dry-run`                                              | what it would do about one pull request, posting nothing |

## Why it exists

Both gates recompute from an event, and the events they need are not delivered
reliably in this repository. A review submitted by Copilot usually creates no
workflow run at all; the agent-review verdict arrives as a comment posted by an
agent, which is the same actor class. When the event goes missing, the status
keeps reporting the previous commit — and **a status nobody recomputed is
indistinguishable from one that is honestly still waiting.**

The measurement, and the two commands that reproduce it against live data, are in
issue #737. Do not copy the ratio into this file: it moves, and nothing here
would notice.

Today the consequence of a stale status is latency. Once #698 promotes either
context to a required check, it is a pull request that cannot merge, whose only
recovery is re-running an _earlier_ workflow run — a step no author finds
unaided. That is why this lands first.

## It is not the polling the gate header rejects

[`copilot-review-gate.yml`](../../.github/workflows/copilot-review-gate.yml)
rules out a job that sleeps waiting for a review, on the grounds that it burns
Actions minutes for the length of the wait and still races. That objection is
sound and this does not contradict it, because a reconcile sweep is a different
mechanism, not a slower version of the same one:

|                                           | A job that sleeps                                 | This sweep                                  |
| ----------------------------------------- | ------------------------------------------------- | ------------------------------------------- |
| What it holds open                        | one run, for as long as the review takes          | nothing                                     |
| What its cost scales with                 | review latency                                    | the number of open pull requests            |
| What it does when the head moves under it | publishes about the commit it started waiting for | reads the head again and posts against that |
| What it does when the event never arrives | waits until the run times out                     | corrects the status on the next pass        |

The last row is the one that matters. A sleeping job is another way of waiting for
the same event; a sweep does not need the event at all.

## The interval

**Every 30 minutes, at :07 and :37.** Recorded here and in the workflow because
it is a judgement, not a default:

- **Low enough** that a stale status corrects itself inside a working session.
  An author who pushes, waits for the review and comes back to the tab finds the
  status right; the longest anyone sits in front of a wrong status before
  break-glass is worth reaching for is one interval.
- **High enough** not to be the thing the gate header rejects. The run does no
  install and no build — it reads a handful of API pages per open pull request,
  and this repository holds a handful of them open at a time.
- **Offset off the hour** because scheduled runs across GitHub queue longest at
  `:00`. A tighter cron would not buy a tighter bound in any case: scheduled runs
  are best-effort and routinely late under load, so a five-minute schedule
  promises a freshness it cannot keep.

One workflow serves both gates rather than one each. There is a single mechanism
here — recompute a review-gate status without the event that normally would — and
two copies of it would mean two schedules to keep in step and two ways for one of
them to stop running unnoticed.

## What it will and will not publish

The sweep hands each gate a pull request **number** and lets the gate read
everything else. Each gate then reads the head and the reviews (or the comments)
together and posts against **the head it read**. Three consequences:

- **It cannot publish a stale verdict of its own.** No SHA crosses an I/O
  boundary. If a push lands while the sweep is working through the list, the gate
  reads the new head and reports on that; the worst case is a status posted
  against a commit that has just stopped being the head, which nothing displays
  and the next pass supersedes. What cannot happen is a verdict about the new
  head derived from the old head's reviews.
- **It posts only when the head does not already say this.** Identical state and
  identical description means nothing is posted at all — that is what makes the
  sweep idempotent, and what makes a pull request nobody has reviewed genuinely
  unaffected: the event path already published the waiting state, the sweep
  recomputes the same one and has nothing to add.
- **It never downgrades `failure` to `pending`.** The Copilot gate's `failure`
  means a run _watched_ a review land against a superseded commit. The sweep
  cannot witness that — it sees only that the newest review is not of the head,
  which is the state that produced the `failure` — so replacing it would turn a
  red check yellow and read as progress. For the same reason the sweep never
  _publishes_ `failure`: that state needs a review submission event behind it,
  and `pending` is what it reports instead. Both block.

## Telling "not reviewed yet" from "reviewed, but not recomputed"

This is the distinction the gate could not express before, and it is now a
one-liner rather than an inference:

```bash
vp run copilot-review:status -- --pr <n> --dry-run
```

It prints the head, how many reviews it counted, and the state it _would_
publish, without touching anything. Compare that to what the pull request is
showing:

| It would publish | The PR shows | Reading                                                             |
| ---------------- | ------------ | ------------------------------------------------------------------- |
| `pending`        | `pending`    | not reviewed yet — the gate is right, wait                          |
| `success`        | `pending`    | reviewed, and the event that should have recomputed it went missing |
| `pending`        | `success`    | the head moved after the review; a push is what will correct it     |

The same holds for the other gate with
`vp run agent-review:verify -- --pr <n> --dry-run`.

## Recovery, when the status is wrong right now

Waiting up to one interval is the ordinary answer. When that is too long:

1. **Run the sweep against that one pull request**, from a checkout with `gh`
   logged in:

   ```bash
   vp run review-gates:reconcile -- --pr <n>
   ```

   It is the same code the schedule runs, and it posts only if the head does not
   already carry the verdict it computes.

2. **Dispatch the gate from Actions**, which needs no checkout — pick
   **Copilot Review Gate**, **Agent Review Gate** or **Review Gate Reconcile**,
   press **Run workflow**, and give the pull request number. A dispatch is
   attributed to whoever pressed it, so a maintainer's run executes where the
   bot-triggered event it stands in for does not.

   ```bash
   gh workflow run copilot-review-gate.yml -f pr=<n>
   gh workflow run agent-review-verdict.yml -f pr=<n>
   gh workflow run review-gate-reconcile.yml -f pr=<n>
   ```

   **Precondition, and it is narrower than it looks.** The API resolves a
   workflow by **filename against the default branch**, but reads the trigger and
   the job from the ref you dispatch. Measured on #738 while none of this was on
   `main`: `--ref <branch>` dispatches of `copilot-review-gate.yml` and
   `agent-review-verdict.yml` both ran and published, from the branch's copy,
   because those filenames already existed on `main` — while
   `review-gate-reconcile.yml` returned `HTTP 404: workflow … not found on the
default branch`. So a **new** workflow cannot be dispatched until it merges; a
   new `workflow_dispatch` trigger on an existing one can. Do not generalise this
   from the `issue_comment` rule in the agent-review gate's header — that one is
   about which ref the workflow _runs from_, and it is a different rule.

Neither of these is the hand-posted status in
[`copilot-review-gate.md`](./copilot-review-gate.md#break-glass); both recompute
the verdict rather than asserting one, so nothing they publish has to be
re-derived by a later reader.

## When the sweep itself fails

This is the one component here whose failure would otherwise be invisible: if it
errors, both statuses simply stop being corrected and every pull request still
looks normal. So it is deliberately loud.

- The sweep **exits non-zero** when it could not list the pull requests, or when
  any gate run failed. It never reports success for a sweep that did not do its
  work — the same argument `deps:audit` makes about a check that could not run.
  An empty list of open pull requests is a different thing and is reported as
  such; a failure to _read_ the list throws.
- The workflow turns that into a **tracking issue**, filed once and commented on
  thereafter, rather than only a red X on a schedule nobody is watching. This
  mirrors [`deps-audit.yml`](../../.github/workflows/deps-audit.yml), which made
  the same decision for the same reason.
- Every run writes a job summary naming the pull requests it swept and the
  verdict of each gate run, so "swept nothing" and "swept everything, all clear"
  are never the same green tick.

**One failure mode is outside all of that:** GitHub disables `schedule` triggers
in a repository with no activity for 60 days, and emails the owner. A repository
that quiet has no open pull requests to reconcile, but re-enable the workflow
before relying on it again.

## Preconditions these notes depend on

- The reconcile is **advisory today**, because both gates are (#698 promotes
  them). Nothing merges or fails on what it publishes.
- The Actions approval policy is `first_time_contributors`. The sweep is
  unaffected by it — a scheduled run is attributed to the repository, not to the
  actor whose event went missing — and that is precisely why it works where the
  event does not.
- Both statuses are read and written by context **name**. Renaming either
  detaches the gate, the sweep and the ruleset entry all at once.

## Related

- [`copilot-review-gate.md`](./copilot-review-gate.md) — the Copilot gate's states and its break-glass ladder
- [`docs/agents/agent-review-contract.md`](../agents/agent-review-contract.md) — what the other gate validates
- [ADR-076](../decisions/ADR-076-reconcile-the-review-gate-statuses-on-a-schedule.md) — why a sweep rather than a fix to the trigger
- #737 — the measurement; #698 — the promotion this unblocks
