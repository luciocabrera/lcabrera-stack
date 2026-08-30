# The merge queue on `main`

What changes when `main` requires a GitHub merge queue: where the required checks
run, what "merging" now means for a human and for the PR queue operator, and how
to read a pull request the queue throws out.

The decision — a merge queue rather than strict required checks or a curated
re-run list — is
[ADR-097](../decisions/ADR-097-recompute-the-merge-bar-in-a-queue-not-on-every-open-pull-request.md).
This document is the operational half.

## What it is for

A required check is evaluated against a merge commit built when the check ran.
Ruleset `19141543` sets `strict_required_status_checks_policy: false`, so nothing
recomputes it when the base moves. That is harmless for a check that reads only
the diff and not harmless for the gates that read the **whole tree** —
`adr:verify`, `docs:verify`, `renames:verify`, `commands:verify`,
`inventory:verify`, `suppressions:verify` — each of which can pass on a pull
request and fail on `main` afterwards, because the thing it objects to arrived
from the other side. Two ADRs taking the same next free number is the worked
example, and it came within one merge of landing (#1034).

A merge queue closes that by building the real merge result on a temporary
`gh-readonly-queue/main/pr-<n>-<sha>` branch — the base as it is now, plus every
entry ahead in the queue, plus this pull request — running the required checks
there, and merging only if they pass. Nothing on any open pull request has to be
updated for it to happen.

## The trap: a check that does not report inside the queue

**A merge queue dispatches `merge_group`, and a workflow without that trigger
never reports there.** The queue then waits for a check that will never arrive,
with nothing in the UI saying why. GitHub's own note is the one to read:
"you need to update the workflows to include the `merge_group` event as an
additional trigger. Otherwise… the merge will fail as the required status check
will not be reported."

So the rule is mechanical: **every workflow producing a required context carries
`merge_group`.** The current required contexts come from the ruleset, never from
a list in a document — copy nothing from here, run this:

```bash
gh api repos/luciocabrera/lcabrera-stack/rulesets/19141543 \
  --jq '.rules[] | select(.type=="required_status_checks")
        | .parameters.required_status_checks[] | .context'
```

`SonarCloud Code Analysis` is the one that cannot be made to report. It comes
from the SonarCloud app, not from a workflow here, and SonarCloud runs in
Automatic Analysis mode: it analyses `main` and pull requests and nothing else, so
a queue branch gets no analysis and the app posts no check on it. GitHub's
guidance for a third-party provider is to configure it to build
`gh-readonly-queue/…` branches, which Automatic Analysis offers no way to do.
It therefore comes **off** the required list when the queue goes on — see
[the ruleset change](#the-ruleset-change) — and what covers it instead is
`Strict Sonar issue gate`, which already runs `sonar-report.mjs --gate
--fail-on-issues`: `--gate` fails on the same SonarCloud quality gate the app's
check reports, and `--fail-on-issues` fails on any open issue, which the app's
rating-based gate does not.

## What each gate diffs against inside the queue

`github.event.pull_request` does not exist in a `merge_group` payload. A gate
that reads a base ref from it resolves to nothing and reports on an empty diff —
green, having checked nothing. Two mechanisms replace it, and neither has a
per-workflow copy:

- **A base to diff against** is `github.event.merge_group.base_sha`, which the
  payload documents as the merge group's **parent** commit. So
  `base_sha..head_sha` is this pull request's own change on top of everything
  ahead of it in the queue — the tree it will actually land on, which is exactly
  the recomputation the queue exists for. `check-safe.yml` resolves it once into
  `DIFF_BASE`, and `test:changed`, `typecheck:changed`, `renames:verify`,
  `api-surface:verify` and the fallow audit all read that.
- **The pull request itself** comes from the queue branch's ref, which is the only
  thing in the payload that names it. `scripts/resolve-subject-pr.mjs` parses it,
  reads the pull request through the API, and exports `BRANCH_NAME`, `PR_TITLE`,
  `PR_BODY`, `PR_BASE`, `PR_NUMBER`, `PR_HEAD_SHA`, `PR_IS_FORK`,
  `RANGE_BASE_SHA` and `RANGE_HEAD_SHA`. It **fails** when it cannot resolve one:
  a gate that cannot name its subject must not fall back to a default. The
  decisions are `scripts/lib/merge-queue.mjs` and are unit-tested.

Two gates need more than a base.

**`Copilot review complete` is a commit status, not a check run.** It is
published on the pull request's head, and the queue reads the required contexts
against the merge group's commit — a different commit, which the status never
reaches. `copilot-review-gate.yml` therefore runs on `merge_group` too and
publishes the same verdict about the same head on the merge group's commit. The
verdict does not weaken: it still means an accepted reviewer's own newest review
names the pull request's head, and a queued pull request cannot move underneath
it, because a push removes it from the queue.

**`Strict Sonar issue gate` reads the queued pull request's analysis**, since
SonarCloud will never analyse a queue branch. That is the freshest analysis of
that code that exists. What does change is the timeout: on a pull request a Sonar
latency spike skips the check rather than blocking an author, and the queue build
catches whatever that let through — but in the queue a skip would be the last
word before the merge, so the queue run passes `--require-analysis` and a missing
analysis fails.

## Two answers this repository made explicit

**Required for `main`, and only for `main`.** The `merge_queue` rule goes on
ruleset `19141543`, whose condition is `refs/heads/main`; a merge queue cannot be
enabled on a wildcard branch pattern anyway. It is not a per-pull-request opt-in:
there is no such thing, and there should not be — a queue that some pull requests
skip does not give the property it was installed for. In practice that means
every pull request, because `verify-pr.mjs` already rejects one targeting
anything but `main`. The changesets "Version Packages" pull request goes through
it like any other.

**An ejection is not an ordinary check failure, and it gets its own signal.**
When the queue removes an entry, the failing checks belong to the merge group's
commit; the pull request's own required checks stay exactly as green as they
were. Every rollup probe — `gh pr checks`, `statusCheckRollup`,
`mergeStateStatus` — therefore reads it as ready, which is the same silent shape
as the defect the queue was installed to fix. GitHub records it on the pull
request's timeline and nowhere else:

```bash
gh api graphql -f query='
  query($owner:String!, $repo:String!, $pr:Int!) {
    repository(owner:$owner, name:$repo) {
      pullRequest(number:$pr) {
        isInMergeQueue
        mergeQueueEntry { state position }
        timelineItems(last:1, itemTypes:[ADDED_TO_MERGE_QUEUE_EVENT, REMOVED_FROM_MERGE_QUEUE_EVENT]) {
          nodes { __typename ... on RemovedFromMergeQueueEvent { createdAt reason } }
        }
      }
    }
  }' -f owner=luciocabrera -f repo=lcabrera-stack -F pr=<n>
```

The PR queue operator reads exactly that (policy S11) and raises it as a §5 flag
that must be discharged with a probe before the pull request is handed back to
the queue — a rejection caused by another entry in the group is ordinary and
re-queueing is right, a rejection caused by this pull request is not. It is a
flag rather than a stop because it clears itself: a new head commit, or a
re-queue, discharges it.

## What "merge" means now

`gh pr merge <n> --squash` is the one command, and it is correct on both sides of
the change: where a queue is required gh adds the pull request to it, and where
one is not it squash-merges. Two flags must not be used with it:

- **`--admin` merges past the queue and past every required check.** The
  repository owner's role is a bypass actor on the ruleset, so this works rather
  than failing — which is precisely why nothing automated may pass it.
- **`-d` / `--delete-branch`** is refused outright by gh where a queue is
  required, because the merge has not happened yet. Delete the branch after the
  merge lands.

The pass that enqueues therefore ends with the pull request **queued, not
merged**. Closing the linked issue, deleting the branch and pruning the worktree
all wait for `state: MERGED`, which is a later observation — see
[`merge-checklist.md`](../agents/merge-checklist.md) and
[`.claude/pr-queue-policy.md`](../../.claude/pr-queue-policy.md) §4.

## The ruleset change

Ruleset `19141543` is live branch protection. Applying this before the workflows
above are on `main` blocks every merge: the queue would dispatch `merge_group`
events that no workflow answers, and every entry would sit until
`check_response_timeout_minutes` elapsed and then be ejected.

The change is two edits to the ruleset's `rules` array:

1. Drop `SonarCloud Code Analysis` from `required_status_checks` (it cannot
   report on a merge group — see above).
2. Add a `merge_queue` rule. Every parameter is required by the API:

```jsonc
{
  "type": "merge_queue",
  "parameters": {
    "check_response_timeout_minutes": 60,
    "grouping_strategy": "ALLGREEN",
    "max_entries_to_build": 5,
    "max_entries_to_merge": 5,
    "merge_method": "SQUASH",
    "min_entries_to_merge": 1,
    "min_entries_to_merge_wait_minutes": 5,
  },
}
```

`merge_method: SQUASH` keeps `main` linear and keeps the pull request title as
the commit subject, which is what `pr-standards.yml` gates and what the changelog
reads. `grouping_strategy: ALLGREEN` requires every entry's own merge commit to
pass, not just the last one in the group — `HEADGREEN` would let a failing entry
ride in on a green group head, which is the property being bought here.
`min_entries_to_merge: 1` means a single pull request never waits for company.

Read the current rules, edit that array, and PUT it back — the API replaces the
whole `rules` array, so a partial payload silently drops the other rules:

```bash
gh api repos/luciocabrera/lcabrera-stack/rulesets/19141543 > ruleset.json
# edit ruleset.json: drop the SonarCloud context, append the merge_queue rule
gh api --method PUT repos/luciocabrera/lcabrera-stack/rulesets/19141543 \
  --input <(jq '{name, target, enforcement, conditions, rules, bypass_actors}' ruleset.json)
gh api repos/luciocabrera/lcabrera-stack/rulesets/19141543 --jq '[.rules[].type]'
```

In the UI the same change is **Settings → Rules → main protection**: uncheck
`SonarCloud Code Analysis` under "Require status checks to pass", tick "Require
merge queue", and set the fields above.

## After it is on

The first pull request through the queue is the probe. Watch that every required
context reports against the `gh-readonly-queue/main/pr-<n>-<sha>` ref — a context
that is still `Expected` after a few minutes is one whose workflow is missing the
`merge_group` trigger, and the fix is the trigger, never dropping the context.
