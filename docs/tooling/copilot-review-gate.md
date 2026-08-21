# The `Copilot review complete` gate

**What it asserts:** some **accepted reviewer's** newest review names the pull
request's **current head commit**. Nothing weaker — "someone has reviewed this PR
at some point" is the state that let #671 look fully reviewed while two later
pushes had been seen by nobody.

It does **not** mean a reviewer approved, and it never has. It means a reviewer
ran against this head. Do not upgrade it.

**There are two accepted reviewers, and the gate is green when EITHER has
reviewed the head** — see [The two accepted reviewers](#the-two-accepted-reviewers).
The context is still named `Copilot review complete`; that mismatch is known and
is not a bug, see the same section.

A review is attached to the commit it reviewed, and GitHub renders a completed
review the same way whether or not that commit is still the head. Requiring
conversation resolution (ruleset `19141543`, added by #694) does not close this:
every thread from an old review can be resolved while the newest commit has had
no review at all.

| Piece                                                                                          | What it is                                                    |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| [`.github/workflows/copilot-review-gate.yml`](../../.github/workflows/copilot-review-gate.yml) | when it recomputes                                            |
| [`.github/workflows/claude-review.yml`](../../.github/workflows/claude-review.yml)             | the second reviewer — posts a review, publishes no status     |
| [`scripts/copilot-review-status.mjs`](../../scripts/copilot-review-status.mjs)                 | the I/O — reads the PR, posts the status                      |
| [`scripts/lib/copilot-review.mjs`](../../scripts/lib/copilot-review.mjs)                       | the comparison, pure and unit-tested                          |
| [`scripts/lib/copilot-suppressed.mjs`](../../scripts/lib/copilot-suppressed.mjs)               | the suppressed-comment reader, pure and unit-tested           |
| [`review-gate-reconcile.md`](./review-gate-reconcile.md)                                       | the sweep that recomputes it when the event does not          |
| `vp run copilot-review:status -- --pr <n> --dry-run`                                           | what the gate would say about a PR right now, posting nothing |
| `vp run copilot-review:suppressed -- --pr <n>`                                                 | the findings Copilot suppressed rather than filed as threads  |

## The states

The status is published against the head SHA under the context
`Copilot review complete`. The name is the whole interface — ruleset contexts
match by name, so renaming it detaches the gate silently.

For the same reason the workflow's **job** is deliberately called something
else. A job's check run and a commit status share one namespace on a pull
request, so a job named after the status would publish a second check under that
name which is green whenever the workflow merely ran — and now that the context
is required, that is the one that could satisfy it.

| State     | When                                                                                    |
| --------- | --------------------------------------------------------------------------------------- |
| `success` | an accepted reviewer's own newest submitted review names the head commit                |
| `pending` | it does not, and a review may still arrive                                              |
| `failure` | an accepted reviewer has just submitted a review and it names something other than head |

`success` says **which** reviewer satisfied it — `Reviewed by <login> at <sha>` —
and that is not decoration. If one reviewer stops reviewing entirely, every pull
request says so on its face instead of reading exactly as it always did. A
monoculture is the kind of thing nobody notices while it is happening.

`failure` is narrow on purpose, and narrower still since a second reviewer
arrived. Pending means "waiting is enough"; `failure` is for the one case where
waiting provably is not. With a single reviewer that was simply "it has spoken and
nothing further comes on its own". With two, one of them may be reviewing the head
at the moment the other's stale review fires this gate — so `failure` now also
requires that **every** accepted reviewer has a counted review on the pull request
and none of them covers the head. The cases that gives up report `pending`, which
also blocks and does not claim more than it knows.

**Do not expect `failure` on #671's literal trace.** There only Copilot has
reviewed, so not every accepted reviewer has spoken and the status is `pending`.
Right now `failure` is unreachable altogether rather than merely narrow, though the
reason changed with #865: the Claude leg can now trigger this gate (it posts under a
GitHub App, not the `GITHUB_TOKEN`), so what makes `failure` unreachable is the other
half — `everyReviewerHasSpoken`, and Copilot cannot review while its credits are
exhausted. `pending` blocks
just as firmly, so nothing is lost; but a `pending` someone was told to expect as
`failure` is the kind of thing that gets "fixed" later.

Dismissed and still-unsubmitted reviews are not counted, and an unrecognised
review state is not counted either — the comparison is whitelisted so an
unfamiliar payload leaves the gate pending rather than passing it.

## The two accepted reviewers

The set lives in one place —
[`scripts/lib/copilot-review.mjs`](../../scripts/lib/copilot-review.mjs), as an
explicit named list — and adding to it is an edit someone makes on purpose. It is
matched by equality, not by a regex over bot logins, not by a `[bot]` suffix test
and not by a substring: each of those would admit reviewers nobody chose.

| Reviewer                             | What it is                                                                                                           |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `copilot-pull-request-reviewer[bot]` | the Copilot code review bot ruleset `19141543` requests on every push (`review_on_push: true`)                       |
| `claude-general-reviewer[bot]`       | [`.github/workflows/claude-review.yml`](../../.github/workflows/claude-review.yml), posting under its own GitHub App |

**The Copilot path is dormant, not removed.** Copilot code review is a server-side
Copilot feature and cannot be pointed at a personal Anthropic key — BYOK covers
Copilot Chat, the CLI and the IDEs, not the pull request reviewer — so with credits
exhausted `review_on_push: true` keeps requesting reviews that never arrive. Nothing
about that configuration was changed, deliberately, so the Copilot half resumes with
no config change the day credits return. A gate that is permanently non-green because
its only reviewer cannot review is what this second reviewer answers.

### Newest per reviewer, not newest overall

Each accepted reviewer's **own** newest review is compared against the head, and the
gate is green if any of them names it. That is not the same as taking the newest
review overall, and the difference shows up on an ordinary sequence:

1. a push lands; the in-workflow reviewer reviews the new head and posts
2. Copilot — whose re-review was requested before that push — submits its review of
   the previous commit half an hour later

Newest-overall would then report `pending` (or `failure`) on a head that **has** been
reviewed, because the most recent review names an older commit. Nothing superseded
the review that covered the head, so calling it stale contradicts what this status
asserts.

Per reviewer still blocks #671, which is the case the gate exists for: there Copilot's
own newest review names an earlier commit, so nothing covers the head and the status
stays `pending`. A rewind needs no special case either — a force-push back to an
already-reviewed commit leaves each reviewer's newest review naming the commit that
was rewound away.

### OR, not AND — and why it cannot live in the ruleset

Green when **either** accepted reviewer has reviewed the head.

AND would block every pull request today, because Copilot cannot review at all. It
would also make a merge depend on two vendors at once, which is a worse availability
posture than the one this change fixes. What OR costs is that "Copilot specifically
reviewed this" stops being enforceable; if that property is wanted back it belongs in
a second, informational, non-required context — not in this one.

**Rulesets AND their required contexts together**, so OR cannot be expressed at the
ruleset level at all. It has to live inside the single status, which is why the change
is in `copilot-review.mjs` and not in repository settings.

### The second entry used to name the runner, and #865 closed that

`claude-review.yml` authenticated with the default `GITHUB_TOKEN`, so its review was
authored by `github-actions[bot]` — the identity **every** workflow here holds. Any
workflow in this repository that posted a review satisfied this gate, not only that
one. It stayed tolerable because nothing else posted one and the context was still
advisory — it is required now, so the same hole would be a merge bar anything in
Actions could clear.

It now posts under the **Claude General Reviewer** GitHub App, and the entry was
**replaced rather than extended**. Keeping both would have left the hole open while
making `everyReviewerHasSpoken` require three reviewers — weaker in two directions at
once.

**The sharper reason is that it unblocks a second in-workflow reviewer.**
`latestReviewPerReviewer` keys by login, so two reviewers sharing `github-actions[bot]`
collapse into one bucket and the newest wins: reviewer A's review of the current head
is discarded when reviewer B posts later against a stale one. Distinct identities are a
precondition for the roster growing, not tidiness.

Two tests hold this, and they cover different failures — worth separating, because one
of them was originally claimed by the other and is not something it can see.

- `copilot-review-reviewers.test.mjs` asserts `github-actions` is **not** accepted, so
  re-adding it **to the set** fails the build rather than silently widening the gate. It
  reads the constant, so that is all it covers.
- `claude-review-workflow.test.mjs` asserts the submit step uses the App token. Without
  it, a fallback to `github.token` would leave the set correct and every reviewer test
  green while **every review stopped matching** — the status stuck at `pending` for a
  reason nothing reports. Planting that fallback fails this test and no other.

Rotation is manual and unowned by automation: the App's private key does not expire,
but if it is regenerated, `REVIEWER_APP_PRIVATE_KEY` must be replaced by hand or every
review stops posting.

### The name still says Copilot

The context is `Copilot review complete` while it accepts two reviewers. That is
known, and it is deliberately not fixed here.

The name is the whole interface — ruleset contexts match by name, so renaming it
detaches the gate silently — which makes a rename a ruleset edit plus a docs edit.
That has no business riding along with a change to what the status _means_, so the
two were kept apart. **Future work**, and a reader finding the mismatch has found a
known trade rather than a bug.

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

## Suppressed comments — the findings no merge bar sees

Conversation resolution (ruleset `19141543`) is what forces a Copilot finding to
be answered before a merge, and it sees **review threads**. Copilot does not file
every finding as one: what it judges low-confidence goes into the review **body**,
inside a collapsed `Suppressed comments` block, which never becomes a thread. So a
pull request can carry unanswered review findings and still resolve to zero
unresolved threads. Some of them are real defects — #750 measures a merged pull
request where they were.

**They are reported, and they never block.** The state this gate publishes says
nothing about them; the findings ride in its log, its job summary and a clause on
the status description. Why reporting rather than blocking, and why no rule
promotes one to a blocker, is
[ADR-078](../decisions/ADR-078-surface-suppressed-comments-without-blocking.md).

One command lists them, from a checkout, posting nothing:

```bash
vp run copilot-review:suppressed -- --pr <n>
```

### The four answers, and why none of them is a bare zero

Every way of failing to read Copilot's markup produces the same output as a pull
request that genuinely has nothing suppressed — a wrong reviewer-login spelling, a
renamed section, an API shape shift. So the report names a **state** rather than
printing a count, and a reader has to be able to tell these apart:

| It says                                   | It means                                                                                   |
| ----------------------------------------- | ------------------------------------------------------------------------------------------ |
| `N suppressed findings from M comments …` | Copilot suppressed findings; `N` locations to answer, `M` is what its own blocks add up to |
| `no suppressed comments in … reviews`     | Copilot reviewed and suppressed nothing — the only zero to believe                         |
| `no Copilot review to read`               | nothing has been reviewed yet, so nothing can be said either way                           |
| `could NOT be read`                       | the parser hit something it does not understand; the count is unknown, **not** zero        |

`could NOT be read` is the one to act on: it means Copilot's block has moved, and
the reader in
[`scripts/lib/copilot-suppressed.mjs`](../../scripts/lib/copilot-suppressed.mjs)
needs updating. It exits non-zero, prints what it could not read, and — because it
never blocks — leaves the merge bar exactly where it was. Three checks raise it:
the count GitHub declares in the block's own summary disagreeing with what parsed,
a review body in no shape this knows, and a collapsed section about suppression
whose label does not match.

`M` running ahead of `N` is normal rather than a discrepancy: Copilot re-emits a
still-open suppressed comment on every re-review, in fresh wording, and the report
groups those by file and line.

### Finding one whose line has moved

**Search for the quoted source, not the line number.** Each finding is printed
with the source Copilot quoted under it — behind a `|` in the terminal, as an
indented code block in the job summary — and that is the part worth pasting into
a search. The line number in the heading is the one Copilot saw, on the commit it
reviewed, and a pull request has usually moved past it by the time anyone reads
the report; the quoted text survives that where a number does not.

Both of those shapes are load-bearing rather than styling: a review body quotes
the pull request's own diff, so every value in this report is text an outside
author chose. Two things follow, and changing either shape changes the guarantee
with it.

- **In the terminal, every line begins with a marker the renderer owns** — `- `
  for a finding, `> ` for Copilot's prose, `| ` for quoted source, `! ` for a
  problem. The Actions runner trims a line before testing it for a `::` command
  (`actions/runner`, `src/Runner.Common/ActionCommand.cs`), so indentation is not
  a guard and a visible character is: after trimming, the line starts with a
  marker rather than with a path or a phrase a pull request wrote.
- **In the job summary, quoted source is an indented code block**, never a fenced
  one, because a fence ends on a line of backticks the quote itself can carry.

Neither replaces the other half: values are single-lined where they are parsed,
in
[`scripts/lib/copilot-suppressed.mjs`](../../scripts/lib/copilot-suppressed.mjs),
whose header lists every value and what makes it safe. Single-lining stops a
value opening a line of its own; the markers stop it owning the start of the line
it is already on.

### Reading them straight out of the API

The command above is the same read, done for you. When you want the raw evidence —
or are checking the parser against it — this is what it is reading. Note the
`[bot]` suffix: `.user.login` is `copilot-pull-request-reviewer[bot]` over REST and
`copilot-pull-request-reviewer` over GraphQL, and a filter written for one silently
matches nothing on the other.

```bash
gh api --paginate 'repos/luciocabrera/vite-react-compiler/pulls/<n>/reviews?per_page=100' \
  --jq '.[] | select(.user.login | startswith("copilot")) | .body' \
  | grep -A20 'Suppressed comments'
```

`--paginate` is not optional: every thread reply is its own review, so a busy pull
request runs past one page and the suppressed blocks on the later ones vanish
without a word. The count of blocks that command finds and the pull request's
thread count answer different questions — compare them with

```bash
gh api graphql -F n=<n> -f query='
  query($n: Int!) {
    repository(owner: "luciocabrera", name: "vite-react-compiler") {
      pullRequest(number: $n) { reviewThreads(first: 100) { totalCount } }
    }
  }' --jq '.data.repository.pullRequest.reviewThreads.totalCount'
```

— which is the measurement #750 is built on: a suppressed comment contributes
nothing to that number.

**When the markup moves**, the bodies in
[`scripts/lib/copilot-suppressed-fixtures.json`](../../scripts/lib/copilot-suppressed-fixtures.json)
are re-captured from a live review. The command above prints one block for
reading; that file stores the **whole body**, JSON-escaped, so capture it as JSON
rather than transcribing it — a fixture someone retyped teaches the parser a
format that never existed:

```bash
gh api --paginate 'repos/luciocabrera/vite-react-compiler/pulls/<n>/reviews?per_page=100' \
  --jq '.[] | select(.id == <review-id>)
        | {body, id, login: .user.login, pr: <n>, submittedAt: .submitted_at}'
```

That prints one entry of that file. They are frozen bodies and cannot notice a
format change on their own; what notices is the declared-count check, running
against real bodies every time this gate does.

### The Claude reviewer has the same two tiers, and it is deliberate

Since #857 that reviewer files each finding as an **inline comment**, so it opens a
thread and conversation resolution holds the merge on it — the thing that was true of
Copilot and not of this leg. Before that its whole review was body prose, which held
nothing: #833 carried an unanswered review of `fa0c852a` and still reported
`mergeStateStatus: CLEAN`.

But a finding is only posted inline if its line is one **the diff added**, checked
against GitHub's per-file patch list by `scripts/lib/review-inline-comments.mjs`. One
that misses is rendered into the body under _Findings that could not be anchored to
the diff_, with the reason — and, exactly like a suppressed comment, it **does not
block**.

**That reproduces the hazard this section is about, and it is the lesser of two.**
The reviews API rejects a comment whose line is not in the diff by rejecting the
whole review, not the comment. Submitting unvalidated anchors would mean one bad line
costs every finding beside it, and `claude-review.yml`'s "a run that reviews nothing
must fail" guard would then turn a correct review into a red check. So the choice is
between a finding that does not block and a review that does not arrive.

The tell is different from Copilot's, and better: an unanchored finding says on its
face why it could not be placed, where a suppressed comment gives no reason and hides
inside a collapsed block. `#750`'s failure mode — real defects riding along unseen —
is narrower here but not gone. **Read that section of the body.**

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
  one pull request, attributed to whoever pressed it. Since #853 this is also
  pulled automatically: `claude-review.yml` dispatches it after submitting a
  review, because that review generates no event this workflow can subscribe to.
  That dispatch names the pull request's head ref (#866); dispatching without one
  runs the **default branch's** copy of the gate, which is the wrong code to judge
  a pull request that edits the gate — see the next paragraph.
- **`vp run copilot-review:status -- --pr <n>`**, which is the same script.

The run reads the head **and** the reviews from the API and posts against the
head it read, never against the SHA in the event payload. Two runs racing then
agree about **which commit** they are judging instead of publishing verdicts
about different ones, which is why the workflow has no `concurrency` group —
cancelling a superseded run would leave an event with no status at all.

**Agreeing on the commit is not agreeing on the verdict, and the difference is
the code each run executes.** A `pull_request` or `pull_request_review` run
checks out that pull request's merge ref; a `workflow_dispatch` run checks out
the ref the dispatch named, and a schedule always runs the default branch. So on
a pull request that changes what the gate accepts, two runs read one head and one
review list and still disagree. Measured on #866, which **replaces** an entry in
`ACCEPTED_REVIEWERS` rather than adding one: at 08:43:12Z the merge-ref run posted
`success — Reviewed by claude-general-reviewer[bot] at a46eaf8`, and at 08:43:15Z a
refless dispatch running `main`'s older copy computed `0 counted from an accepted
reviewer` and overwrote it with `pending`. The last writer wins, and nothing reports
the disagreement.

Replacement is the precondition, not merely a change to the set. A **widened** set
still contains every login the older copy accepts, so both copies would count the
same review and agree; the disagreement needs the two sets to be **disjoint on the
reviewer that reviewed**. A pull request that only adds a reviewer does not
reproduce this.

Naming the head ref narrows the dispatch's skew rather than closing it, and the
remainder is a different order of problem. The event-driven triggers check out the
pull request's **merge ref**; a dispatch checks out the ref it was given, which is
the branch **tip**. Those are different commits whenever `main` has moved since the
branch point, so the two runs can still execute different gate code — but both
copies are now the pull request's own, which is the part that decided the verdict
above. It inverts the staleness rather than removing it, and that is a trade worth
naming: before, every dispatch ran `main`'s gate, wrong only for a pull request that
edits the gate — loud, and confined to one class. Now every dispatch runs the branch
tip's gate, which is wrong whenever `main` has fixed the gate and the branch has not
rebased — quieter, and possible on any stale branch. Taken deliberately, because the
loud case is the one that blocks a merge. A merge-ref/tip difference is the ordinary
staleness every CI run carries;
judging a pull request by the branch it is replacing is not. (A branch cut before
this workflow carried `workflow_dispatch` 404s the dispatch instead, landing on the
warning path with the sweep as backstop.)

It does **not** change the scheduled sweep, which GitHub always runs from the
default branch — so on a pull request editing the gate, the sweep still judges it
with `main`'s copy of the gate code. **#868 closed the direction that would have
made a required context unmergeable**: the sweep no longer replaces a `success`
here, so the status is not flapped away every half hour any more. The opposite
direction is open by design — the sweep can still publish `pending` → `success`
from the code being replaced, which on a pull request that _tightens_ the gate is
a false green on a merge bar.
[`review-gate-reconcile.md`](./review-gate-reconcile.md) owns the rule, that
residual case, and why it is per gate rather than sweep-wide.

**This gate blocks.** `Copilot review complete` became a required context on
ruleset `19141543` on 2026-08-21 — the first half of #698 — so a pull request
whose head carries no accepted review does not merge, and `pending` is the state
it sits in while it waits. Promotion was kept separate from the work that built
the gate for a reason worth keeping in view: a required check that has never
reported blocks every pull request, including the one that would fix it.

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

- **No accepted reviewer has reviewed this head yet** → wait. Nothing is wrong.
- **One of them has reviewed this head and nothing recomputed** → act. The status is
  not waiting for anything; it is stale, and it stays stale until something runs.

One command answers it, from a checkout, posting nothing:

```bash
vp run copilot-review:status -- --pr <n> --dry-run
```

`success` from that while the pull request shows `pending` is the stale case: the
review is in and only the status is behind, so nothing needs re-requesting.

Without a checkout, ask the API the same question. It answers in one line, and
the pull request number is the only thing to fill in:

```bash
gh api graphql -F n=<n> -f query='
  query($n: Int!) {
    repository(owner: "luciocabrera", name: "vite-react-compiler") {
      pullRequest(number: $n) {
        headRefOid
        reviews(last: 100) { nodes { author { login } state commit { oid } submittedAt } }
      }
    }
  }' --jq '
  .data.repository.pullRequest as $pr
  | [ $pr.reviews.nodes[]
      | select(.author.login | IN("copilot-pull-request-reviewer", "claude-general-reviewer"))
      | select(.state | IN("APPROVED", "CHANGES_REQUESTED", "COMMENTED")) ] as $counted
  | ($counted | group_by(.author.login) | map(max_by(.submittedAt))) as $newest
  | ($newest | map(select(.commit.oid == $pr.headRefOid)) | first) as $covering
  | if ($counted | length) == 0 then "no accepted reviewer has reviewed this pull request yet — wait"
    elif $covering != null then "\($covering.author.login) reviewed the head (\($pr.headRefOid[0:8])) at \($covering.submittedAt) — if the pull request still shows pending, it is stale"
    else "no accepted reviewer'"'"'s newest review names \($pr.headRefOid[0:8]) — wait (newest: \($newest | map("\(.author.login)@\(.commit.oid[0:8])") | join(", ")))"
    end'
```

Everything in it that looks like padding is load-bearing, and each part is the
difference between an answer and a confident wrong one:

- **The `null` arm.** `last` of an empty array is `null`, and jq reads a field
  off `null` and slices it without complaining, so the obvious form —
  `… | last | "\(.commit.oid[0:8])"` — prints `null null` and exits 0 for a pull
  request no accepted reviewer has reviewed at all. That is precisely the state this
  command exists to name, and the one where a reader is least able to tell
  nonsense from an answer.
- **The repository is named in the query**, which is why this one command needs
  no `-R` while every other `gh` command below carries one. Left to itself `gh`
  takes the repository from the working directory's git remote: `gh pr view`,
  `gh run list`, `gh run rerun` and `gh workflow run` all fail outside a checkout
  with `failed to run git`, and inside a _different_ repository they answer
  about, or act on, that one. A break-glass command has to work from wherever
  the person reading this happens to be.
- **One request carries the head and the reviews**, the same way the gate itself
  reads them, so nothing can move between two calls. It also sidesteps the trap
  in the REST form: `GET /pulls/<n>/reviews` returns one page of 30 unless you
  pass `--paginate`, **every thread reply is a review**, and a busy pull request
  passes 30 easily — at which point `last` is the thirtieth review rather than
  the newest one. `reviews(last: 100)` takes the newest hundred instead; beyond
  that, use the `--dry-run` form above.
- **It groups by author before taking the newest, exactly as the gate does.**
  Asking for the newest review OVERALL is a different question, and it gives the
  opposite answer in the sequence this gate is most often in: one reviewer covers
  the head, the other's earlier-requested re-review lands afterwards naming the
  previous commit. Newest-overall then says "not the head — wait" about a head that
  is covered — and this is the section where a reader decides **wait** versus
  **act**, so it would send them away from the recompute they need. That is the
  same defect the author filter had one layer up.
- **Two whitelists and one rule are the gate's own, and all three have to match
  it.**
  `scripts/lib/copilot-review.mjs` counts the states `APPROVED`,
  `CHANGES_REQUESTED` and `COMMENTED` and drops everything else, so a probe that
  took the newest review of _any_ state would call a dismissed review a review of
  the head. It also counts only the reviewers in `ACCEPTED_REVIEWERS`, which is
  why this filter names both logins rather than testing for "copilot" — written
  the old way it reports `pending` on a pull request the Claude reviewer has
  covered, and disagrees with the status it is meant to explain. **A GraphQL
  author login carries no `[bot]` suffix**, which is why these are the bare names;
  over REST the same reviewers are `…[bot]`. Keep both lists identical to the
  module's, whitelisted the same way round: an unfamiliar state or an unknown
  author must fall out of the count, not into it. The third is the comparison
  itself — per reviewer, never newest-overall — which is the divergence this probe
  actually had.

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
gh run list -R luciocabrera/vite-react-compiler \
  --workflow=review-gate-reconcile.yml --limit 5
```

— because a workflow reads `active` in `gh workflow list` from the moment its
file lands on `main`, whether or not a scheduled run has ever happened.
[`review-gate-reconcile.md`](./review-gate-reconcile.md) has the interval and the
rest of the preconditions.

1. **Reply to any review thread** — for the stale case, and the cheapest thing
   that works: no push access, no checkout, no new commit, and usually an action
   you were taking anyway while working through the findings.

   **A thread reply is wrapped in a review, and that is why it works here.** The
   reply is a review _comment_, which is its own event — but GitHub also creates
   a `PullRequestReview` around it (the reply's response carries
   `pull_request_review_id`, and the review appears in the pull request's
   `reviews` list) and delivers `pull_request_review.submitted`. That is the
   event this workflow subscribes to, and a human-submitted review has fired a
   run that executes every time this has been measured (#737 §1). Use the Reply
   box on a thread, or the endpoint behind it:

   ```bash
   gh api repos/luciocabrera/vite-react-compiler/pulls/<n>/comments/<comment-id>/replies \
     -f body='<text>'
   ```

   `gh pr comment` is **not** this. A plain pull request comment is an
   `issue_comment`, which this workflow does not listen to — see its `on:` block;
   the agent-review gate is the one that does.

   Both forms are measured, because the API one looks as though it should
   produce nothing but a review comment:

   - **The endpoint**, on #740, 2026-08-17. That exact call created review
     `4950884297` and fired run `32022891578` two seconds later —
     `pull_request_review`, first attempt, `success` — which published the
     status at 11:01:11Z. No push and no other review happened in that window.
   - **The Reply box**, on #726 at head `81659dff`, 2026-08-15: Copilot reviewed
     at 08:35:28Z and no run appeared; two thread replies at 08:46:26Z and
     08:46:27Z each created a review (`pull_request_review_id` `4943392944` and
     `4943392963`), each fired a run two seconds later, both `success`, and the
     status read `success` at 08:46:35Z.

   **It needs a thread to reply to.** A pull request with every thread resolved,
   or one Copilot reviewed with no findings, has nothing to reply to — take rung 2.

2. **Re-run the gate's own run for the current head** — the stale case again,
   and the rung that needs neither a thread nor a checkout. Find the run by head
   SHA, then re-run it:

   ```bash
   gh run list -R luciocabrera/vite-react-compiler \
     --workflow=copilot-review-gate.yml --limit 20 \
     --json databaseId,headSha,event,createdAt \
     --jq '.[]|select(.headSha|startswith("<head-sha>"))|"\(.databaseId) \(.event) \(.createdAt)"'
   gh run rerun -R luciocabrera/vite-react-compiler <id>
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
   gh workflow run copilot-review-gate.yml -f pr=<n> \
     -R luciocabrera/vite-react-compiler          # or press it in Actions
   ```

   Both re-derive the verdict rather than asserting one, so neither leaves a
   status a later reader cannot reproduce — which is what separates them from
   rung 6. The local form posts as you and leaves no workflow run behind: on #738
   head `bd1b475a` (2026-08-17) the `success` that cleared a missing recompute shows as
   `creator: luciocabrera` with no `target_url` under
   `gh api repos/luciocabrera/vite-react-compiler/commits/<sha>/statuses`, which
   is how to tell a local recompute from a workflow one afterwards.

   **Use the dispatch form to clear a merge. The local form cannot, and it can
   stop anything else from doing so.** Since the context was pinned to
   `integration_id` 15368, a status you post from a checkout has no app behind it
   and does not satisfy the required check — the same limit as rung 6. It is
   worse than rung 6 here, because it also silences the one thing that could have
   cleared the bar: `shouldPublishStatus` withholds a post when the state and the
   description both match what is already there, and the local form computes both
   with the code the scheduled sweep runs. So a locally-posted `success` makes
   every later sweep a no-op on that head. The dispatch form escapes this — the
   gate workflow invokes the script without `--if-changed`, so it publishes
   unconditionally, as `github-actions[bot]`.

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

   This is the same call the workflow makes — but **not from the same identity,
   and since 2026-08-21 that is what decides whether it counts.** The required
   context is pinned to `integration_id` 15368 (GitHub Actions); a status posted
   with a personal token has no app behind it, so this rung clears the _report_
   without clearing the _merge bar_. Still worth posting — it records the reason
   and stops the sweep re-deriving a `pending` over it — but to actually merge,
   go to rung 7.

   It is overwritten by the next event the workflow handles, so post it once the
   head has settled.

7. **Admin bypass of the ruleset.** The context is required, so this is the rung
   that merges.
   `RepositoryRole` 5 keeps `bypass_mode: always` on ruleset `19141543`.

   **Rehearsed on #877, 2026-08-21 — the only rung here that has been exercised
   deliberately rather than in an incident.** It was worth doing: the rung was one
   sentence asserting a capability nobody had used, and #698 makes every stuck pull
   request depend on it. A bypass that turns out not to reach the person holding the
   merge button is an unmergeable pull request with no way out, which is a worse
   position than the gate this ladder exists to escape.

   What the UI actually does, because "there is an admin bypass" does not tell you
   what to look for:

   - The control is a **checkbox**, not a button — red text, unticked by default, below
     the checks list: _"Merge without waiting for requirements to be met (bypass
     rules)"_. Under pressure it is easy to hunt for a differently-worded button and
     conclude there is no way out.
   - While it is unticked the merge button reads **`Squash and merge`** and is
     **disabled**. Ticking it relabels the button to **`Bypass rules and merge
(squash)`** and enables it. That relabel is the confirmation the override actually
     applies to you, as distinct from merely being displayed.
   - No second confirmation, no typed-name prompt.

   How it was rehearsed, since the method generalises: the failing check was
   **`Commit + PR standards`**, made to fail by omitting required sections from the pull
   request **description** while keeping a conforming **title**. That is the cheapest
   deliberate failure available — no code change, and because the squash subject comes
   from the title, `main`'s history is unaffected. The change carried was one the
   repository wanted anyway, so nothing needed reverting. The other 18 checks were left
   to go green first, so the bypass skipped exactly one check whose failure was known.

   **Say so in the commit.** `4a1bd2b5` records that it merged through the bypass and
   why, for the same reason rung 6 puts the reason in the status description: a merge
   past a red required check is a state nobody can re-derive later from the repository
   alone.

## The Claude reviewer's review recomputes this status — since #865

**It did not until #865, and the reason it does now is the credential rather than
anything about the workflow.** GitHub creates no workflow run from an event generated
by the default `GITHUB_TOKEN`, and `claude-review.yml` used to submit with
`github.token` — so this gate's `pull_request_review` trigger could not fire for that
leg at all. It now submits under the Claude General Reviewer GitHub App, whose
installation token is not that token, and the event is delivered.

Measured on #866: review submitted `07:55:45Z`, this workflow ran on
`pull_request_review` at `07:55:48Z`.

**The #853 dispatch stays anyway, and the two are now redundant on purpose.** On that
same run it fired at `07:55:47Z`, a second ahead of the trigger. One measurement is not
a reliability claim; Copilot's trigger on the same endpoint is documented as unreliable
(see the next section); and a dispatch can be retried where a trigger that never
arrives cannot. The sweep remains the backstop if both fail.

Three consequences, none of them a bug:

- **The status is corrected seconds after the review, not at the next sweep.**
  Before #853 it changed at the next push, the next `review-gate-reconcile.yml`
  sweep (within one interval), or a manual recompute — so a reviewed pull request
  could report `pending` for up to a full interval.
- **The sweep is still the backstop, and still has to run.** It covers what the
  dispatch cannot: a dispatch that failed, a run cancelled before it reached that
  step, and Copilot's own reviews. The dispatch shortens the reliance on #737's
  sweep; it does not remove it.
- **`failure` is still unreachable, but no longer for this reason.** It used to be
  that no run for this leg could carry a `triggeringReview` at all, a
  `workflow_dispatch` run having no review attached. Since #865 the
  `pull_request_review` run does carry one — so what blocks `failure` now is
  `everyReviewerHasSpoken`, and Copilot cannot speak while its credits are exhausted.
  Same outcome, different cause: a stale review from this leg reports `pending`,
  which also blocks.

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
gh run list -R luciocabrera/vite-react-compiler \
  --workflow=copilot-review-gate.yml --limit 60 \
  --json event,headSha,createdAt,conclusion \
  --jq '.[]|select(.event=="pull_request_review")|"\(.headSha[0:8]) \(.createdAt) \(.conclusion)"'
gh api --paginate repos/luciocabrera/vite-react-compiler/pulls/<n>/reviews \
  --jq '.[]|"\(.user.login) \(.commit_id[0:8]) \(.submitted_at)"'
```

`--paginate` is not optional there: the endpoint returns 30 reviews a page, and
a review-heavy pull request silently loses the rest — every thread reply is its
own review, so the count runs ahead of what a reader expects. It streams the
filter over each page, so the output is in submission order across all of them.

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
and the `Copilot` bot is not a contributor to this repository. **That reading is
now historical**: the policy was loosened to
`first_time_contributors_new_to_github` on 2026-08-18, which is what the bullet
below predicted would let a Copilot-triggered run execute unheld. Re-read the
setting before reproducing the table above — it was measured under the old
value. What that does not
explain is the majority case, where there is no run to approve; that cause is
undetermined and belongs to **#698**.

Consequences while this stands:

- The status still goes `pending` on every push, and still reports on every
  `pull_request` event. Nothing false is ever published, so this is a
  **liveness** failure and not a soundness one — the gate is never green when it
  should be red, it is late when it should be green. What it costs is that
  `pending` means two different things, which is why the ladder starts by asking
  which one you are looking at.

  **That soundness claim has one stated precondition since #868**, and it is worth
  reading before relying on it. For this context the sweep no longer replaces a
  `success` it may not have computed, so it no longer corrects one left standing by a
  **dismissed** review whose event went missing — which would be green when it should
  be red. (The rule is per gate: `Review threads resolved` keeps its downgrade, because
  the sweep is that context's only publisher.) The
  case is unreachable today only because no accepted reviewer posts a dismissible
  review (both are `COMMENTED`, and GitHub dismisses only `APPROVED` /
  `CHANGES_REQUESTED`). #699 would change that.
  [`review-gate-reconcile.md`](./review-gate-reconcile.md) owns the detail.

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

**No review lands from a fork, and the two legs do not look alike on the pull
request. Read this before concluding that one of them is broken.**

| Leg     | What happens on a fork                                                                            | How it looks |
| ------- | ------------------------------------------------------------------------------------------------- | ------------ |
| Copilot | reviews normally — it runs server-side — but this gate's own run cannot publish a status          | check absent |
| Claude  | the job runs and fails: secrets are not exposed to fork pull requests, so the credential is empty | check red    |

**The gate's own run is absent-rather-than-red.** A pull request from a fork gets a
read-only `GITHUB_TOKEN`, so no commit status can be published from **its own** run.
The workflow detects this, prints the verdict it would have posted, and emits a
warning rather than failing opaquely on a 403. This repository is single-owner, so
the case is rare by construction; it is documented so that it is understood rather
than discovered.

**`claude-review.yml` runs and goes RED, and that difference is the part worth
knowing.** It has no fork guard and no `continue-on-error`, and the action calls
`core.setFailed` on both fork paths — an actor without write access is refused before
any credential is read, and an actor with write access but no secret fails credential
validation. Both legs are fail-closed and neither publishes a status from a fork, but
one is absent and the other is red, and a reader expecting parity will misread one of
them. It is **not** to be "fixed" with `pull_request_target`: that would trade a
visible failure for secret exposure on untrusted code.

Either way no review lands from the fork's own run, so the status is the honest
`pending` until an accepted reviewer covers the head.

The scheduled reconcile is not subject to this — it runs from the default branch
with a token that can write statuses, so a fork pull request does get a status
from it, within one interval. That is the same verdict the fork's own run
computed and could not post, so nothing weaker is being asserted: `pending` until
an accepted reviewer reviews the head, exactly as for any other pull request. If
that is needed sooner, **the admin bypass is the way through** — the hand-posted
status (rung 6) stopped being one when the context was pinned to
`integration_id` 15368.

## Preconditions these notes depend on

Everything above describes the repository **after** #694 added
`copilot_code_review` (with `review_on_push: true`,
`review_draft_pull_requests: false`) and `pull_request` to ruleset `19141543`.
Further things the notes assume:

- **This status is a required context** (2026-08-21, the first half of #698) — the
  body above says what that means for a merge. What belongs here is the detail a
  reader cannot see from the check, and which nothing in the tree asserts — read
  it rather than trusting this line:

  ```bash
  gh api repos/luciocabrera/vite-react-compiler/rulesets/19141543 \
    --jq '.rules[] | select(.type=="required_status_checks")
          | .parameters.required_status_checks[]'
  ```

  It is pinned to `integration_id` 15368, the way its Actions siblings are, so
  **only a status posted by a workflow satisfies it**. That is what demotes break-glass rung 6 to a record-keeping step and makes
  [the admin bypass](#break-glass) the rung that merges. The approval limitation
  above is a blocker rather than a nuisance for the same reason, and the
  `github-actions[bot]` hole that used to ride on this reasoning is closed — see
  [the two accepted reviewers](#the-two-accepted-reviewers).

- **`Agent review verdict` is still advisory**, and #698 stays open for it. It
  reports `success — absent` when no verdict was posted, so requiring it today
  would assert nothing; the second half of #698 is what decides whether absence
  should fail.
- **The accepted reviewer set is two, and one of them is dormant.** Everything
  above about Copilot describes a reviewer that currently cannot review, because
  its credits are exhausted; the configuration is untouched, so it resumes on its
  own. A reading of this page taken while only one reviewer was accepted will be
  wrong about which reviews count.
- **The Actions approval policy is `first_time_contributors_new_to_github`**
  (loosened from `first_time_contributors` on 2026-08-18, because holding every
  Copilot-triggered run meant a maintainer had to approve one before the status
  could post). The prediction that a Copilot-triggered run then executes on its
  own is **observational and not yet confirmed** — the next held run, or the
  absence of one, is the evidence. Tighten it and more actors are gated. Read
  the setting rather than this line before trusting either table above; loosening
  it was safe here only because no workflow uses `pull_request_target`, so a fork
  pull request never receives secrets.
- **The scheduled reconcile is running.** Everything above that says a stale
  status corrects itself assumes it is. GitHub disables `schedule` triggers after
  60 days of repository inactivity, so `gh workflow list` says whether this one
  is still active — and
  `gh run list -R luciocabrera/vite-react-compiler --workflow=review-gate-reconcile.yml --limit 5`
  says whether it
  has actually run, which is the question. A workflow reads `active` from the
  moment its file lands on `main`, before any scheduled run has happened, and
  that reads exactly like one that is sweeping.

One expectation the measurements **disproved**, recorded so it is not
re-inherited: the `pull_request_review` half was expected to be inert until the
workflow file reached `main`, on the general rule that non-`pull_request` events
run workflows from the default branch. The review-triggered runs on #707 came
from that pull request's own code
(`head_branch: ci/695-copilot-review-complete-check`) on 2026-08-14, while the
workflow file did not reach `main` until `4660e05f` the next morning — so on this
event GitHub cannot have used the default branch's copy.

The ref it does use is the pull request's **merge ref**, not the branch tip: run
`32022891578` checked out `refs/remotes/pull/740/merge`. Both halves are worth
keeping, because "not the default branch" and "the branch tip" are different
claims and only the first follows from the run list. Re-derive them with

```bash
git log --format='%h %ad' --date=short main -- .github/workflows/copilot-review-gate.yml
gh api '/repos/luciocabrera/vite-react-compiler/actions/workflows/copilot-review-gate.yml/runs?per_page=100' \
  --jq '.workflow_runs[]|select(.event=="pull_request_review")|"\(.created_at) \(.head_branch) \(.conclusion)"'
gh run view <id> -R luciocabrera/vite-react-compiler --log | grep 'Checking out the ref' -A2
```

Re-read this section before treating a quiet gate as a broken one.
