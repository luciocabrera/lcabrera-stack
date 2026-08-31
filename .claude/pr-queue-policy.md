# PR Queue Operator Policy

The standard the autonomous PR queue operator (`vp run pr:queue`) is held to.
It is the operator's only source of authority: every verdict in a decision log
cites a rule id from this file, and an action with no rule id behind it is a bug
in the operator, not a judgement call it was entitled to make.

**Bias: action.** A pass that ends with an eligible PR still open has failed, and
"analysed the queue, recommended nothing" is the specific failure mode this
policy exists to prevent. The operator is not a reviewer that produces advice for
a human to enact — it lands the PR. The counterweight to that bias is §5: the
stop list is absolute, and the operator would rather leave the whole queue
untouched than take one action off it.

Both halves are load-bearing. Do not soften §5 to unblock a merge, and do not
add a "recommend to human" outcome to §1 to avoid one.

**"Lands" is one command with two meanings, and the branch decides which.** Where
`main` requires a GitHub merge queue, `gh pr merge <n> --squash` adds the PR to
the queue and GitHub merges it later, after re-running the required checks
against the real merge result; where no queue is required, the same command
squash-merges on the spot. The operator never chooses between them and never
passes `--admin`, which would go past both. Why the queue was chosen over strict
required checks is
[ADR-098](../docs/decisions/ADR-098-recompute-the-merge-bar-in-a-queue-not-on-every-open-pull-request.md);
what it changes for a reader is
[`docs/tooling/merge-queue.md`](../docs/tooling/merge-queue.md).

---

## 1. Verdict vocabulary

Exactly one verdict per PR per pass. There is deliberately no verdict meaning
"looks fine, a human should land it" — that is `ENQUEUE`, and if it cannot be
`ENQUEUE` then some rule below says why.

| Verdict    | Means                                                                           | Operator does                                                          |
| ---------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `ENQUEUE`  | Every §2 gate passes and no §5 trigger fires                                    | Runs A5 now, in the §3 order. Where a queue is required the PR is then |
|            |                                                                                 | queued, not merged, and A6–A8 are unowned until #1043 (§4)             |
| `ACT`      | Not eligible, but the blocker is entirely inside §4                             | Performs the named §4 actions, then re-evaluates on the next pass      |
| `WAIT`     | Blocker clears on its own with no input from anyone (a check still running)     | Nothing. Records what it is waiting on and the earliest re-check       |
| `ESCALATE` | A §5 trigger fired, or a §4 action hit its attempt bound, or evidence is absent | Stops on that PR, writes the escalation reason, touches nothing        |

**This table is the whole vocabulary, and it is closed.** A response naming
anything else — the spelling a verdict used to have, a lower-cased one, a word
invented on the spot — is not a weaker verdict, it is not a verdict: the decide
pass is treated as having produced none, and the PR escalates under S10. It is
never passed through, because a verdict nothing recognises is skipped by
`applyDecisions` and counted in no column of the decision log, which reads as
"nothing to do here" — the one outcome S10 exists to forbid. `PRECEDENCE` in
`pr-queue-gate.mjs` is that vocabulary in code; the decide pass's JSON schema and
the ceiling check both derive from it, so a rename cannot leave one of them
admitting a word the others refuse.

`ESCALATE` is per-PR, not per-queue: one escalating PR never stops the operator
from landing an unrelated eligible one. The exception is an ordering edge (§3) —
escalating a PR escalates everything downstream of it in the same chain, because
landing a dependent without its base is how a queue corrupts itself.

## 2. Eligibility

All of these must hold. Any one failing means the PR is not `ENQUEUE`; which
verdict it gets instead depends on whether the fix is in §4 (`ACT`), is a matter
of time (`WAIT`), or is in §5 (`ESCALATE`).

| Id  | Gate                                                                                                                                                                                                                                                                                  | Probe                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| E1  | **Not a draft.** Draft is the author's own "not yet" and the operator never overrides it (see A9)                                                                                                                                                                                     | `gh pr view <n> --json isDraft`                                                        |
| E2  | **No conflict.** `mergeable` is `MERGEABLE` — `CONFLICTING` is §5/S3, `UNKNOWN` is `WAIT` (GitHub is still computing it)                                                                                                                                                              | `gh pr view <n> --json mergeable,mergeStateStatus`                                     |
| E3  | **Every check concluded, none failed.** A queued or in-progress check is `WAIT`, never "probably fine"                                                                                                                                                                                | `gh pr checks <n>`                                                                     |
| E4  | **Zero unresolved review threads**, whoever opened them — human, Copilot, or another agent. An outdated-but-unresolved thread still counts                                                                                                                                            | `vp run pr:threads -- --pr <n>` (exit 0 = clear)                                       |
| E5  | **No changes requested** by a reviewer that are still outstanding                                                                                                                                                                                                                     | `gh pr view <n> --json reviewDecision`                                                 |
| E6  | **The PR body conforms** to the enforced template — every heading of `.github/pull_request_template.md`, plain spelling                                                                                                                                                               | `vp run pr:verify -- --body-file <path>`                                               |
| E7  | **The title is a Conventional Commit.** A squash merge takes the PR title as the commit subject, so a bad title becomes a bad commit on main                                                                                                                                          | `vp run commit:verify -- -` with the title                                             |
| E8  | **The diff is non-empty.** A PR that changes no files has nothing to merge — that is S7, not a trivially-approved merge                                                                                                                                                               | `gh pr view <n> --json files`                                                          |
| E9  | **No §5 trigger fires** anywhere in the diff                                                                                                                                                                                                                                          | §5 probes                                                                              |
| E10 | **The branch is not behind base** — but only where no merge queue is required. In front of one this gate is off: the queue builds the PR on the live base and runs the required checks there, so updating the branch would re-run every check and re-request every review for nothing | `mergeStateStatus` + `isMergeQueueEnabled` (`BEHIND` with no queue → `ACT` on A1)      |
| E11 | **Not already in the merge queue.** A queued PR is mid-flight; every action in §4 removes it and restarts the wait, so the only correct response is to leave it alone                                                                                                                 | `isInMergeQueue`, `mergeQueueEntry.state` (GraphQL — `gh pr view` has no field for it) |

E6 and E7 are here because this repo enforces them in CI (`pr-standards.yml`)
and by git hook. The operator checks them itself rather than trusting a green
rollup, so that landing is never the thing that discovers a gate was skipped.

E10 and E11 are read from GraphQL for the same reason E4 is: the REST payload
carries neither, so a `gh pr view` probe cannot see a queue at all.

## 3. ORDER derivation

The open PRs form a DAG, not a list. Edges are derived in this precedence, and
the order the operator lands them in is a topological sort of the result. Where a
merge queue is required this is the order they are HANDED to it in; the queue
merges first-in-first-out from there, and it — not the operator — is what makes
each PR's checks true against the ones ahead of it.

- **O1 — Stack edges (structural).** If PR B's `baseRefName` is PR A's
  `headRefName`, then A → B: A merges first. This is the only edge GitHub itself
  knows about, and it is authoritative — never reorder around it.
- **O2 — Declared edges.** A body line matching `Depends on #N`, `Stacked on #N`,
  `Blocked by #N`, or `After #N` creates N → this PR. The author's declaration
  outranks any inference the operator makes below.
- **O3 — File-overlap edges.** Two open PRs touching the same path are ordered
  **smaller diff first**, so the larger PR absorbs the rebase rather than the
  other way round. Overlap is a _sequencing_ constraint, never a blocker: after
  the first merges, the second must go green again (A1 + a fresh §2 pass) before
  it is eligible. Never merge both on one pass on the strength of a rollup that
  predates the first merge.
- **O4 — Snapshot-last.** A PR whose content is an assertion about what has
  already landed — a coordination-register sweep, a baseline rebaseline, a
  generated index or changelog — merges **after** every PR in its overlap set.
  Landing it early does not conflict; it makes it silently wrong, which is worse.
- **O5 — Deterministic tiebreak.** Anything still unordered goes by ascending PR
  number. A queue that reorders itself between two passes over the same facts is
  not auditable, so the tiebreak is total and never random.

A cycle in the DAG is `ESCALATE` for every PR in it — a cycle means two authors
each believe the other merges first, and guessing is how one of them gets
clobbered.

**Re-derive the order after every landing.** The order computed at the start of a
pass is stale the moment the first PR lands, because O3's overlap sets and every
`mergeStateStatus` change underneath it. Where a merge queue is required, an
`ENQUEUE` does not land the PR within the pass at all — it goes to E11/`WAIT` on
the next one, and the order is re-derived then against what has actually merged.

## 4. Allowed autonomous actions

No human confirmation needed. Every one of these is bounded, and every
invocation is logged with the exact command run.

| Id     | Action                                   | Bound                                                                                                                        |
| ------ | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **A1** | Rebase / update branch onto base         | Only when `BEHIND` **and** the rebase is conflict-free. First conflict → abort the rebase, restore the ref, S3               |
| **A2** | Re-run a transient CI failure            | Transient as defined below. One re-run per check per pass; a second identical failure is by definition not transient → S10   |
| **A3** | Fix lint / format fallout                | Only the mechanical output of the repo's own fixers (`vp lint --fix`, `vp fmt`, `vp run lint:eslint`). Never a hand-rewrite  |
| **A4** | Reply to and address a Copilot comment   | Verify first — see below. Reply on every thread it resolves, stating which                                                   |
| **A5** | Land it: `gh pr merge <n> --squash`      | That exact command and no other form of it. `forbiddenActions` in `pr-queue-gate.mjs` matches it as an ALLOW-LIST, so        |
|        |                                          | `--admin`, `--auto`, `-d`, `-m`/`--merge`, `-r`/`--rebase`, `--repo`, a `#42` or URL spelling of `<n>`, and any flag gh      |
|        |                                          | adds later escalate the pull request without being enumerated. Writing `main` by another route is refused by shape: the      |
|        |                                          | REST merge, branch-merge and git-refs endpoints, the merge/enqueue/ref GraphQL mutations, and a `git push` whose             |
|        |                                          | destination refspec is `main` — see what that bound is and is not, below. Subject is the PR title (E7 already                |
|        |                                          | gated it). Where a queue is required this enqueues, and the pass ends with the PR queued rather than merged — success        |
| **A6** | Close the linked issue                   | Only an issue the PR body links via a closing keyword, and only after the merge is confirmed on `main`. **No pass performs   |
|        |                                          | this in front of a queue** — see below                                                                                       |
| **A7** | Delete the head branch                   | After merge, remote and local. Never a branch with commits that did not land (see the squash-merge trap in §6). **No pass    |
|        |                                          | performs this in front of a queue** — see below                                                                              |
| **A8** | Prune the worktree                       | Via `vp run housekeeping:prune -- --apply` only, which already refuses a dirty worktree, an un-PR'd commit, and any stash.   |
|        |                                          | **No pass performs this in front of a queue** — see below                                                                    |
| **A9** | ~~Mark a draft ready~~ — **not allowed** | Draft is the author's signal that the work is unfinished. The operator has no basis to overrule it. Listed here so it is not |
|        |                                          | mistaken for an oversight                                                                                                    |

**A5 — how `forbiddenActions` is shaped.** In two halves, because the two halves
of the problem are opposite. The flags of `gh pr merge` are a **closed**
vocabulary — this row authorises one form — so that half is an allow-list, and a
spelling nobody anticipated is refused rather than admitted. Which **transport**
writes `main` is open (gh, `curl`, `git` itself), so that half stays a deny-list
keyed on the endpoint path, the mutation name and the push destination; an
allow-list there would have to enumerate every command A1–A8 legitimately
proposes, which is open too, and a leash that blocks ordinary work is a leash
that gets widened. So `git push --force-with-lease origin <head>` (A1) and
`git push origin --delete <head>` (A7) pass, and `git push origin HEAD:main`
does not.

**A5 — the deny-list half is not complete, and cannot be.** It refuses the
operations that name themselves in plain text. It does not see one whose text
does not name it — a path or a ref held entirely in a variable, a script file, an
encoded string, or a spelling nobody has written down yet. Every round of this
guard so far has been another such spelling found by a reader, which is the
evidence for the general claim: adding shapes narrows the gap and never closes
it.

**A5 — what it bounds, and what it does not.** It reads the DECISION's action
list, which is the audited artifact, and escalates the whole pull request rather
than filtering the offending line. So the shapes it names do not reach the apply
pass _through the decision_ — that, and not "nothing forbidden reaches it", is
the property. It is not a sandbox over that pass: `EXECUTE_TOOLS` has to include
`Bash(gh api:*)` for A4's reply endpoint and S11's timeline query and
`Bash(git:*)` for A1's rebase, a Claude Code Bash rule matches by prefix, and
gh's method is a flag — so no allow-list admits those while denying
`--method PUT /repos/{o}/{r}/pulls/{n}/merge`, which merges directly, or
`git push origin HEAD:main`, which needs no API at all. Both succeed for this
account, whose role bypasses the ruleset. A decision-time audit is not
containment; the containment is that pass's tool list, which is #1040 and does
not exist yet. Stated here because a reader deciding how much to trust the leash
needs its edge, not its headline.

**A5–A8 span passes once a queue is required, and A6–A8 are unowned in that
window.** A5 hands the PR over; GitHub merges it minutes later, after building it
on the live base. So A6, A7 and A8 — which all require the merge to have happened
— may not be performed by the pass that enqueued: closing the issue and deleting
the branch on the strength of having _asked_ for a merge acts on a merge that has
not happened and may still be rejected (S11).

**Nothing performs them instead.** There is no merged-pull-request lane: the
operator's only source of pull requests is `QUEUE_QUERY` in
`scripts/lib/pr-queue-github.mjs`, which is `pullRequests(states: OPEN, …)`, and
`scripts/pr-queue-operator.mjs` builds every verdict from what `fetchQueue`
returns — so a merged pull request never reaches `decide()` or
`applyDecisions()` again and no pass can observe `state: MERGED` for it. In front
of a queue, therefore, **linked issues stay open, head branches stay on the
remote and worktrees accumulate**, and the enqueuing pass reports success while
that happens. It is a known, stated gap, not an implied mechanism:
[#1043](https://github.com/luciocabrera/lcabrera-stack/issues/1043) is the lane
that closes it. Until it lands, A6–A8 are a human's job after the queue merges —
`vp run housekeeping:prune -- --apply` is A8's half.

Nothing here changes where no queue is required. There `gh pr merge <n> --squash`
merges synchronously, the pass still holds the pull request, and A6–A8 run in it
exactly as before.

**A2 — what "transient" means.** A failure is transient only when the log shows
the job never got to run the repo's own checks: runner allocation, a network or
registry timeout, a cancelled job, an action-internal error. No suite here needs
a database, so there is no known environmental race to add to that list.
**A failing assertion is never transient**, however flaky it looks, and a
re-run whose only justification is "it passed locally" is S10 — that is a
conclusion, not evidence.

**A4 — verify before you apply.** A review comment is a claim, and this repo's
Rule 11 cuts both ways: never silence one without reading the code, and never
apply one without checking it either. Copilot's comments here have been wrong
about repo facts. So: reproduce the claim against the tree first. If it holds,
fix the code and reply with what changed. If it does not, reply with the probe
that disproves it and resolve the thread — a wrong comment is answered, not
obeyed, and never silently ignored. Applying an unverified comment is S10. The
rule and the mechanics are
[`docs/agents/pr-review-threads.md`](../docs/agents/pr-review-threads.md);
`vp run pr:threads -- --resolve <id>` is the resolve step.

## 5. STOP-AND-ESCALATE

Hard stops. On any of these the operator does not merge, does not "work around",
does not attempt a partial fix — it writes the trigger id, the evidence, and
what it would have needed, and moves to the next PR. **There is no override
flag.** If one of these fires wrongly, the fix is to change this file in its own
reviewed PR (which S9 keeps the operator's hands off).

- **S1 — Any API or schema breaking change.** A removed or renamed export from
  any `@lcabrera/*` package, a changed `exports`/`publishConfig` map, a narrowed
  public type, a major changeset, or a migration that drops or alters an existing
  column, table, or constraint. Probe: `vp run api-surface:verify`, the changeset
  files in the diff, and any `packages/*/migrations/**` path.
- **S2 — Any test deletion or weakening.** A deleted test file, a removed `it(` /
  `test(` / `describe(`, a suite turned `.skip` / `.todo` / `.only`, a widened
  coverage exclusion, or a threshold lowered. Deleting a test is how a red gate
  is made green without fixing anything, and the operator can never tell the two
  apart from a diff.
- **S3 — Any conflict needing semantic judgement.** That is every conflict, with
  exactly one carve-out: a conflict confined to a fully generated artifact that a
  single documented command regenerates (`pnpm-lock.yaml`, `CHANGELOG.md`, a
  generated `tsconfig.*.json`, `BOARD.md`) may be resolved by regenerating it and
  nothing else. A conflict in hand-written code, in a test, or spanning both a
  generated and a hand-written file escalates.
- **S4 — Secrets, credentials, or env material** anywhere in the diff, including
  a new `.env`, a token-shaped literal, or a change to `docker/local/**` env
  wiring.
- **S5 — A new suppression.** Any added inline `eslint-disable` / `oxlint-disable`,
  rule-off in config, or `eslint-suppressions.json` entry — and inside a package
  on the never-baseline roster, any at all. **Derive that roster, never recall
  it:** `vp run suppressions:packages` prints it, and `pr-queue-operator.mjs`
  resolves it once per pass, from the operator's **own checkout**, then hands the
  array to `pr-queue-gate.mjs` — which reads no filesystem and never sees the head
  ref. Two consequences follow, and both matter. A PR that adds a new public
  package is judged against the roster **without** it, until the operator's
  checkout carries that package's gitignore line; treat such a PR as S1 and read
  the diff. And a roster that resolves empty is treated as "every `packages/*`
  directory", not "none", so a broken resolution over-flags instead of merging.
  This trigger used to carry a literal list of package paths, narrower than the
  roster the standing rules cover, so a suppression forbidden everywhere could
  still read as `ENQUEUE` in the packages the literal had missed. Rule 11 says fix
  the code; a suppression arriving with a green rollup is exactly the case the
  rule exists for.
- **S6 — Another agent is holding the branch.** The head ref moved during the
  pass, the PR is claimed by a live task in `docs/coordination/` owned by someone
  else, or the action would force-push over commits the operator did not make.
- **S7 — Nothing to merge, or stated intent not to.** Zero changed files, or a
  body that says no changes were made. That is a question for the author.
- **S8 — Release or publish surface.** A version bump in a public package, a
  change under `.github/workflows/**` that touches the publish path or grants
  permissions, or anything affecting trusted-publisher config. Nothing but the
  version number stands between a mistake and the registry, and an npm version is
  permanent.
- **S9 — Self-modification.** A PR that edits this policy, the operator, or
  anything the operator imports. It does not merge changes to its own leash.
  That set is `OPERATOR_FILES` in `pr-queue-gate.mjs`: this document, plus the
  transitive import closure of `pr-queue-operator.mjs`. It is not curated —
  `pr-queue-gate.test.mjs` walks the real import graph and fails when the list
  and the graph disagree, in either direction.
  **What it costs.** The closure reaches shared modules under
  `packages/repo-standards/scripts/`, so a PR editing the commit convention, the
  config reader or the workspace roster escalates even though it was not aimed at
  the operator. The commit convention is the one worth naming: it decides E6 and
  E7, which are eligibility blockers carrying `ACT` rather than stops, so without
  this the operator would have _acted_ on a changed convention rather than
  halted. Over-stopping is the direction to be wrong in, and S9 is per-PR, so it
  never holds an unrelated merge.
  **What it does not cover.** The walk follows `import`, so anything read at run
  time sits outside it, and there are two kinds. This document is read by path
  and is listed by hand. The never-baseline roster is read by _shape_ — every
  workspace's `.gitignore`, plus the `packages/` listing — so no list could name
  it in advance. What bounds that one is where it is read from: `REPO_ROOT` comes
  from `import.meta.url`, so the roster is always the operator's own checkout and
  nothing in the branch under judgement can move it. A PR that adds or removes a
  public package changes what the operator flags only once it has merged and the
  operator's checkout has followed.
- **S11 — The merge queue rejected this PR.** GitHub removed it from the queue,
  and nothing has been pushed since. This is its own trigger because it is
  invisible everywhere else: the failing checks belong to the merge group's
  commit, so the PR's own required checks stay exactly as green as they were, and
  every rollup probe reads it as ready. Handing it straight back to the queue is
  S10 — read why it was rejected first. A rejection caused by another entry in
  the group is a real and ordinary outcome, and re-queueing is then the right
  answer; a rejection caused by this PR is not. It is a flag rather than a stop
  because it clears itself: a new head commit, or a re-queue, discharges it, and a
  stop would need a human for the rest of the PR's life.
- **S10 — No re-runnable evidence.** Any verdict the operator cannot support with
  a command someone else can run and an observation that would have come out
  differently had the verdict been wrong. Absence of evidence escalates; it never
  defaults to merge.

## 6. Evidence standard

Non-Negotiable Rule 14, applied to a verdict.

Every verdict names the probe that produced it and what the probe returned. A
verdict derived from a PR title, a body claim, or a green rollup alone does not
meet the standard — the rollup is the thing under test.

Before recording a verdict, ask **what else would produce this observation**. A
check named "Quality Gate" passing does not establish that the eslint pass ran;
a clean `gh pr checks` does not establish that a required check exists. If
another explanation fits the same observation, the probe does not discriminate
and the verdict is S10 until a better one does.

Two probes worth pinning, because the obvious form of each is wrong here:

- **Unresolved threads need GraphQL.** `gh pr view --json comments` does not
  carry resolution state, so a PR with open threads reads as clean. Use
  `repository.pullRequests.nodes.reviewThreads` and filter on `isResolved`.
- **A squash merge defeats ancestry checks.** After A5 the head branch's commits
  do not appear on `main`, so `git merge-base --is-ancestor` and a three-dot diff
  both report the work as unmerged. Confirm a merge by the PR's own `state`, and
  confirm content by comparing trees — never by branch ancestry (A7 depends on
  getting this right, or it deletes work).
- **A queue ejection is not in the checks.** `gh pr checks` and the status rollup
  describe the PR's head commit; the queue's verdict is about the merge group's
  commit, which is not the head and never becomes it. So "the checks are green"
  does not discriminate between a PR the queue has not looked at, one it is
  currently building, and one it has thrown out. `isInMergeQueue` and the
  `RemovedFromMergeQueueEvent` timeline entry do (E11, S11), and both are GraphQL
  only.

## 7. Passes, idempotence, and the log

A pass is: read the open PRs → derive facts → derive order (§3) → decide every PR
→ act in order → write the log. It is idempotent: running it twice over an
unchanged set produces the same verdicts, and an `ENQUEUE` already performed
becomes `WAIT` on E11 — the PR is in the queue, so the second pass leaves it
there rather than making a second attempt.

Each pass writes `reports/pr-queue/runs/<timestamp>/` — `decision-log.md` for
reading and `decisions.json` for diffing. Produced on demand and never committed,
per [ADR-049](../docs/decisions/ADR-049-findings-reports-are-produced-on-demand.md).

The log records, per PR: the verdict, the rule ids behind it, every probe run
with its observation, the position in the order and the edges that put it there,
and — for `ACT` and `ENQUEUE` — the exact commands executed or that would be. A decision log that does not let a reader re-derive the verdict without
re-running the operator has not done its job.
