# The review-gate reconcile

**What it is:** a scheduled sweep that republishes every review-gate commit
status — `Copilot review complete`, `Agent review verdict` and
`Review threads resolved` — for every open pull request, so that a status left
stale by an event that never arrived corrects itself without anybody noticing it
was stale.

| Piece                                                                                              | What it is                                               |
| -------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| [`.github/workflows/review-gate-reconcile.yml`](../../.github/workflows/review-gate-reconcile.yml) | the schedule, the dispatch, and what it does on failure  |
| [`scripts/reconcile-review-gates.mjs`](../../scripts/reconcile-review-gates.mjs)                   | the sweep — lists open pull requests, runs each gate     |
| [`scripts/lib/review-gate-reconcile.mjs`](../../scripts/lib/review-gate-reconcile.mjs)             | the two decisions, pure and unit-tested                  |
| `vp run review-gates:reconcile`                                                                    | the same sweep by hand                                   |
| `vp run review-gates:reconcile -- --pr <n> --dry-run`                                              | what it would do about one pull request, posting nothing |

## Why it exists

Each gate recomputes from an event, and the events they need are not delivered
reliably in this repository. A review submitted by Copilot usually creates no
workflow run at all; the agent-review verdict arrives as a comment posted by an
agent, which is the same actor class. When the event goes missing, the status
keeps reporting the previous commit — and **a status nobody recomputed is
indistinguishable from one that is honestly still waiting.**

The measurement, and the two commands that reproduce it against live data, are in
issue #737. Do not copy the ratio into this file: it moves, and nothing here
would notice.

For `Copilot review complete` — required since 2026-08-21 — a stale status is a
pull request that cannot merge. The recovery is the gate's own `workflow_dispatch`
— **break-glass rung 3**, its `gh workflow run` form, in
[`copilot-review-gate.md`](./copilot-review-gate.md#break-glass) — which exists so
nobody has to hunt for an earlier run to re-run. Two caveats before pressing it: a
dispatch naming no ref runs `main`'s copy of the gate, which is the #866 failure;
and rung 3's _local_ form does not clear a required context, for the reason that
rung records. For the two contexts still advisory the
consequence is only latency. This sweep landing first is what made the promotion
safe.

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

One workflow serves every gate rather than one each. There is a single mechanism
here — recompute a review-gate status without the event that normally would — and
a copy per gate would mean a schedule apiece to keep in step, and that many ways
for one of them to stop running unnoticed. Adding a gate is one entry in the
sweep's `GATES` list; it is deliberately not a new workflow.

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
- **For `Copilot review complete` only, it never weakens a `success` — it only
  re-describes it (#868).** GitHub always runs a `schedule` from the default
  branch, so on a pull request that changes what a gate decides, the sweep is
  judging that pull request with the code it is replacing. Measured on #866: one
  head, one review list, and the two copies of the gate computed opposite
  verdicts. The published `success` came from a run that had the pull request's
  own code; the sweep, by construction, does not — so it is not the
  better-informed opinion, and must not win by landing last. A description change
  under an unchanged `success` still posts, because naming which reviewer
  satisfied the gate is what makes a reviewer monoculture visible.

  **Per gate, not sweep-wide, and the distinction is load-bearing.** The argument
  above needs some OTHER publisher to have posted the `success` from
  better-informed code. That holds for `Copilot review complete`, which
  `copilot-review-gate.yml` also runs on events, and it is the only gate that opts
  in (`protectSuccess` in the sweep's `GATES`). It is **false** for
  `Review threads resolved`: nothing in `.github/workflows/` invokes
  `verify-review-threads.mjs`, so the sweep is that context's only publisher and
  therefore always its best-informed one — and `decideThreadStatus` legitimately
  moves `success` → `failure` under an **unchanged head**, when a reviewer opens a
  thread or an author marks a draft ready. Protecting it would freeze that gate
  green for the life of a head while threads sat open, which is the opposite of
  what it exists to say.

## Telling "not reviewed yet" from "reviewed, but not recomputed"

This is the distinction the gate could not express before, and it is now a
one-liner rather than an inference:

```bash
vp run copilot-review:status -- --pr <n> --dry-run
```

It prints the head, how many reviews it counted, and the state it _would_
publish, without touching anything. Compare that to what the pull request is
showing:

| It would publish | The PR shows | Reading                                                                                                                                                                                                                                                             |
| ---------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pending`        | `pending`    | not reviewed yet — the gate is right, wait                                                                                                                                                                                                                          |
| `success`        | `pending`    | reviewed, and the event that should have recomputed it went missing                                                                                                                                                                                                 |
| `pending`        | `success`    | the head moved after the review (a push corrects it), **or** the sweep is running older gate code than the run that posted the `success`. For `Copilot review complete` the sweep leaves it alone either way (#868); for a gate that does not opt in, it overwrites |

The same command shape works for the other gate,
`vp run agent-review:verify -- --pr <n> --dry-run`, but **the last row does not carry
over**: `agent-review` does not opt in, so nothing stops the sweep replacing that
context's `success`. It cannot today for a second reason — `verify-agent-review.mjs`
pins `state=success` in both the status it posts and the one it compares against, so
during the advisory period it never offers a downgrade to withhold. Unpinning it (#698)
is what makes the row's exception live, and is the point at which this gate has to
decide whether it wants the opt-in.

## What the no-downgrade rule gives up

**Which gate this is about: `Copilot review complete`, and only that one.** The other
two contexts the sweep publishes are unaffected — `Agent review verdict` and
`Review threads resolved` do not opt in, so the sweep still downgrades them exactly as
before. Read every claim below as scoped to the one gate; that scoping is itself the
fix for the first shape this rule was written in, which applied to all three.

For `Copilot review complete`, the sweep can no longer correct a **wrongly green**
status. That is a real loss and worth stating rather than leaving to be discovered, but
it is smaller than it sounds, because for that gate the sweep was never the only path:

- **A push** moves the head, so no status exists on the new one and the sweep posts
  there normally — "same head" is what the comparison is about. This path has no
  precondition; it is the reliable one.
- **A dismissed review** downgrades **when its event produces a run.** The wiring is
  there: `copilot-review-gate.yml` has
  `pull_request_review: types: [submitted, dismissed]`, and it invokes
  `copilot-review-status.mjs` without `--if-changed`, so an event-driven run publishes
  whatever it computes, downgrades included. But a subscription is not a delivery
  guarantee, and `pull_request_review` is the exact half
  [ADR-076](../decisions/ADR-076-reconcile-the-review-gate-statuses-on-a-schedule.md)
  measured as unreliable — _"a review submitted by Copilot usually creates no workflow
  run at all"_. This sweep exists **because** of that, so the precondition has to be
  stated rather than implied: the mitigation is real, and it is not guaranteed.

  This is also precisely why the rule is opt-in. `verify-review-threads.mjs` has **no**
  event-driven run at all, so for that context the mitigation would not be merely
  unguaranteed — it would be absent, and the gate would be frozen green.

- **A hand-posted break-glass `success`** (rung 6 in
  [`copilot-review-gate.md`](./copilot-review-gate.md#break-glass)) now survives until
  an event recomputes it, instead of being undone by a sweep minutes later. That is an
  improvement, but a smaller one than it was: since the context was pinned to
  `integration_id` 15368 on 2026-08-21, a status posted by hand does not satisfy the
  required check at all, so what survives is the record rather than the merge.

### The rule is one-directional; the reasoning behind it is not

The sweep still publishes `pending` → `success`. The argument for the rule — _the sweep
runs default-branch gate code, so it is not the better-informed opinion_ — applies just
as well to that direction, and it is not blocked there.

That leaves the **mirror of #866**, on a pull request that makes a gate _stricter_: its
own run posts `pending` (correct under the new, tighter rule), the sweep recomputes with
the lenient code being replaced, gets `success`, and publishes it. Same head, same cause,
opposite direction — and, since `Copilot review complete` became a required context on
2026-08-21, **a false green on a live merge bar** rather than a hypothetical one.

**Deliberately not blocked.** Correcting a `pending` that a missed event left behind is
the sweep's entire job, and it is the very same transition; refusing it would stop the
sweep doing what it exists for while still looking like it worked. That is the trap the
rejected "only fill absence" option fell into.

**It is closer to reachable than the dismissal case below**, and worth saying plainly:
it needs only a pull request that tightens a gate, which is an ordinary change — no
missing event required — and a pull request whose own gate code disagrees with `main`'s
is not hypothetical, because #866 was one. What #866 does **not** evidence is this
polarity: what was measured there is `main`'s code overwriting a `success` with
`pending`, and no instance of the reverse has been observed. What limits the
damage is that the green is not arbitrary — the head really was reviewed under the rule
`main` still holds — and that it lasts only until the pull request merges, after which
both copies agree. If a way to tell "stale code disagrees" from
"a missed event left this stale" is ever wanted, it has to serve both directions.

### The residual case, and what currently keeps it unreachable

**Scoped to `Copilot review complete`.** The first shape of this rule applied to every
gate the sweep drives, and that had a false green reachable _today_, needing none of the
three conditions below: `Review threads resolved` has no publisher but the sweep, and its
verdict flips `success` → `failure` under a fixed head the moment a reviewer opens a
thread. Making the rule opt-in is what removed that, and it is why the roster of opting-in
gates is pinned by a test rather than left to a config nobody reads.

A dismissal whose event goes missing leaves a `success` on an **unchanged head** that
nothing revisits. That is a **false green**, not a stale one — a worse failure than the
flap this rule fixes, because the context is required, so it merges a pull request whose
review was withdrawn.

It needs three things at once, and the first does not hold today:

1. **An accepted reviewer posts a dismissible review.** GitHub offers dismissal only
   for `APPROVED` and `CHANGES_REQUESTED`. The Claude reviewer hard-codes
   `event: 'COMMENT'` in `scripts/lib/review-inline-comments.mjs`, under a comment
   forbidding the other two, and Copilot's reviews are `COMMENTED` as well — so there
   is no dismissible review from an accepted reviewer to dismiss.
2. Someone dismisses it.
3. The `dismissed` event produces no run.

**What holds this shut is a constant in an unrelated file, not anything in this rule** —
which is worth knowing rather than assuming. **#699 is the change that would open it:**
it proposes a reviewer that can `REQUEST_CHANGES`, which is dismissible. If that lands,
this becomes live, and the fix is most likely to give the sweep enough context to tell a
dismissal apart from a disagreement with older gate code — which two status objects
alone cannot do.

One more thing worth knowing: **the sweep's own log will not show you when this rule
fires.** `publishGateStatus` reports every withheld post as `Unchanged on <sha>: nothing
was posted.`, so a declined downgrade reads the same as a genuine no-op — and adding
`--dry-run` to the sweep does not separate them either. `--if-changed` is checked first
and `gateArgs` always passes it, so the same `Unchanged` line comes back; the sweep then
keeps only that last line per gate, so the verdict the gate printed never reaches you.

Run the one gate directly instead — it prints its verdict before it decides whether to
publish, so that line survives whatever the decision was:

```bash
vp run copilot-review:status -- --pr <n> --dry-run
```

That is the same command as ["Telling 'not reviewed yet' from 'reviewed, but not
recomputed'"](#telling-not-reviewed-yet-from-reviewed-but-not-recomputed) above, read for
a different purpose: there to find a status nobody recomputed, here to find one the sweep
declined to move.

## Recovery, when the status is wrong right now

Waiting up to one interval is the ordinary answer. When that is too long:

1. **Run the sweep against that one pull request**, from a checkout with `gh`
   logged in:

   ```bash
   vp run review-gates:reconcile -- --pr <n>
   ```

   It is the same code the schedule runs, and it posts only if the head does not
   already carry the verdict it computes.

   **For `Copilot review complete` this reports rather than recovers.** The status
   it posts is attributed to you, not to an app, so it does not satisfy that
   required context — and because it posts the same state and description the
   schedule would, every later sweep sees no change and withholds.

   **The trap is what that leaves behind, and it closes the reconcile dispatch
   too.** A _Review Gate Reconcile_ dispatch would ordinarily clear the bar — it
   runs in Actions with `github.token`, so its status has an app behind it, and
   `--if-changed` withholds only when the state _and_ the description both match
   what is already there, which a stale `pending` does not. But once this local
   step has posted, the head carries exactly the state and description the sweep
   computes, so every later sweep — scheduled or dispatched — withholds, and that
   dispatch goes green while posting nothing.

   **Copilot Review Gate** (step 2) is the dispatch that clears the bar either
   way, because `copilot-review-gate.yml` invokes its script without
   `--if-changed` and so publishes unconditionally. Reach for it when the merge
   is what you need. This step stays the right one for the two contexts that are
   advisory, and for reading what the sweep thinks.

2. **Dispatch the gate from Actions**, which needs no checkout — pick
   **Copilot Review Gate**, **Agent Review Gate** or **Review Gate Reconcile**,
   press **Run workflow**, and give the pull request number. A dispatch is
   attributed to whoever pressed it, so a maintainer's run executes where the
   bot-triggered event it stands in for does not.

   ```bash
   gh workflow run copilot-review-gate.yml -f pr=<n> \
     -R luciocabrera/vite-react-compiler
   gh workflow run agent-review-verdict.yml -f pr=<n> \
     -R luciocabrera/vite-react-compiler
   gh workflow run review-gate-reconcile.yml -f pr=<n> \
     -R luciocabrera/vite-react-compiler
   ```

   `-R` is what makes "needs no checkout" true. `gh` infers the repository from a
   git remote, so without it these fail with `not a git repository` before any
   dispatch is attempted — which is exactly the wrong moment, since step 1 above
   is the one that already needs a clone. Same rule as the ladder in
   [`copilot-review-gate.md`](./copilot-review-gate.md#break-glass).

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
errors, every status simply stops being corrected and every pull request still
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

- **One of the three gates it drives is required, the other two are not.**
  `Copilot review complete` became a required context on 2026-08-21 (the first
  half of #698), so a status this sweep publishes for that gate now decides a
  merge. `Agent review verdict` is still advisory. `Review threads
resolved` is a report either way: `required_review_thread_resolution` on the
  `main` ruleset is what actually holds that merge, not this status.
- **The promotion activated one hazard this file already describes.** The
  `pending` → `success` direction above — the mirror of #866, on a pull request
  that tightens a gate — was written while every gate here was advisory, so it
  cost a stale status. It now greens a required check. It is tracked, not
  accepted: #884. The dismissal case further down
  is still held shut by its own preconditions.
- **Requiredness is not why a gate opts in to the no-downgrade rule.** The two sit
  next to each other here only by timing — #868 shipped the opt-in before the
  promotion, so being required cannot have been its reason. The reason is the one
  in **Per gate, not sweep-wide** above: another publisher posts that `success`
  from better-informed code. So making `Agent review verdict` required would
  **not** imply opting it in; what governs that is `verify-agent-review.mjs`
  unpinning `state=success`, so it has a downgrade to withhold at all.
- The Actions approval policy is `first_time_contributors_new_to_github`
  (loosened 2026-08-18; see
  [`copilot-review-gate.md`](./copilot-review-gate.md)). The sweep is
  unaffected by it — a scheduled run is attributed to the repository, not to the
  actor whose event went missing — and that is precisely why it works where the
  event does not.
- Every status is read and written by context **name**. Renaming one
  detaches the gate, the sweep and the ruleset entry all at once.

## Related

- [`copilot-review-gate.md`](./copilot-review-gate.md) — the Copilot gate's states and its break-glass ladder
- [`docs/agents/agent-review-contract.md`](../agents/agent-review-contract.md) — what the other gate validates
- [ADR-076](../decisions/ADR-076-reconcile-the-review-gate-statuses-on-a-schedule.md) — why a sweep rather than a fix to the trigger
- #737 — the measurement; #698 — the promotion this unblocks
