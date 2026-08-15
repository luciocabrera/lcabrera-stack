# Epic Orchestration — orchestrator, developer, reviewer

How one agent takes an epic from "open issues" to "merged on `main`", running
developers and reviewers in parallel and escalating to the human only where a
human is genuinely needed.

**To start a run, on any epic:**

```text
/epic <n>
```

That is the whole ignition. The command is
[`.github/skills/epic/SKILL.md`](../../.github/skills/epic/SKILL.md), which binds
it to this page and adds nothing of its own. Where a harness has no skills, the
equivalent prompt is one line:

> Read `docs/agents/epic-orchestration.md` and act as the orchestrator for epic
> `#<n>`. Begin with Phase 0.

The prompt stays one line on purpose. Everything it needs is below, and a
contract in git is a contract that can be corrected — a pasted prompt is a copy
nothing checks, which is the failure mode [`workflow.md`](workflow.md) opens with.

**Nothing below is specific to one epic.** Where a past epic or PR is named it is
evidence for a rule, never an input to your run; the epic-specific part of a run
lives on the epic issue, and [§7](#7-seeding-a-run) says why.

> **This page owns:** the three roles, the dispatch loop, the merge bar, and the
> escalation contract. It owns nothing else. The standing rules are
> [`AGENTS.md`](../../AGENTS.md); claiming is
> [`docs/coordination/README.md`](../coordination/README.md); the gate is the
> [`quality-gate-workflow`](../../.github/skills/quality-gate-workflow/SKILL.md)
> skill; the merge bar's per-item detail is [`merge-checklist.md`](merge-checklist.md);
> the rules of evidence for a reviewer are
> [`refactor-verified-contract.md`](refactor-verified-contract.md). None of those
> is restated here.

---

## 1. The three roles

| Role             | Agent definition                                                 | Runs in                             | Sees                                       | Never does                                      |
| ---------------- | ---------------------------------------------------------------- | ----------------------------------- | ------------------------------------------ | ----------------------------------------------- |
| **Orchestrator** | — (you)                                                          | The main checkout                   | Everything                                 | Write product code; certify a change            |
| **Developer**    | [`refactor-builder`](../../.claude/agents/refactor-builder.md)   | Its own worktree, one per issue     | Its issue, the codebase, its own review    | Review its own work; merge its own PR           |
| **Reviewer**     | [`refactor-verifier`](../../.claude/agents/refactor-verifier.md) | A **separate** worktree, one per PR | The diff + the issue's acceptance criteria | See the developer's reasoning, plan, or PR body |

**The developer and reviewer are agent definitions, not prompts you write.** Both
files already are these roles, and [`refactor-verified`](../../.github/skills/refactor-verified/SKILL.md)
already dispatches them. Spawn them by name and pass the issue or PR number —
never re-narrate the role into the prompt. A role written down twice is a role
that drifts, and the copy living in your prompt is the one nothing checks.

The two flows differ on exactly one thing — **when the PR is readied** — and that
is a dispatch parameter both agents take (Phase 2), not a reason to fork them.
[`workflow.md`](workflow.md) §5: if two approaches exist for one thing, that is
the bug.

The reviewer's blindness is the whole point, and it is argued in full in
[`refactor-verified-contract.md`](refactor-verified-contract.md) §1: an agent that
reads a diff already knowing what it was meant to do reads it for confirmation.
Do not summarise the developer's approach into the reviewer's prompt "for
context" — that hands it the conclusion and buys nothing.

**One developer per issue, one reviewer per PR.** Never reuse a reviewer across
two PRs in the same wave; by the second it has absorbed the first one's framing.

---

## 2. The loop

### Phase 0 — Map the epic

1. Read the epic body and every child issue. Children are discoverable with
   `gh issue list --search "parent:<epic>" --state all`.
2. Build the dependency graph from each issue's **`## 9. Planning Metadata`**
   block — `blockedBy` is the real edge, `blocking` is its mirror and can be
   stale. **Trust `blockedBy`; verify `blocking` against it.**
3. Group into waves — see [Parallelism](#4-parallelism) for what may share one.
4. Write the plan to `.tmp/epic-<n>/plan.md` (gitignored). This survives your own
   context compaction; your memory does not.
5. **Post the same plan as a comment on the epic issue.** `.tmp/` survives your
   compaction and nothing else — not the machine, not another agent, not the human
   away from this terminal. The epic issue is the shared surface; Phase 5 updates
   it there, and the next run reads it as its seed ([§7](#7-seeding-a-run)).
6. **Report the plan to the human before dispatching anything.** The wave order is
   the one decision where being wrong is expensive and being corrected is cheap.

An issue whose `blockedBy` names a **decision** (an ADR issue) blocks its
dependents completely. Do not dispatch build work whose shape the pending ADR
would change — that is work you will throw away. This has cost real work here: a
narrow focus fix was dispatched while the ADR deciding that surface's whole
layout was still open, and the decision discarded it.

### Phase 1 — Dispatch developers

Spawn one [`refactor-builder`](../../.claude/agents/refactor-builder.md) per issue.
The prompt is two lines, because the agent file carries the role:

> Issue `#<n>`. Ready the PR once your gate is green — do not wait for review.

The second line is the dispatch parameter from [§1](#1-the-three-roles). Without
it the builder leaves the PR in draft, which is correct for `refactor-verified`
and wrong here — Phase 2 explains why. Everything else is already in the agent
file: reading the issue in full, claiming **before** touching anything, the
worktree bootstrap, the standing rules, and the `gh pr create` trap. Do not
restate any of it, and do not summarise the issue for the builder — it reads the
issue itself, and your summary is a lossy copy that nothing checks.

A developer reports back: PR number, gate result, and **anything it found that
was not in scope** — filed as a follow-up issue, not silently fixed and not
silently dropped.

### Phase 2 — Review, twice over

`gh pr ready` triggers **Copilot** automatically (no workflow requests it; it is a
repo setting). So every PR gets two independent readers:

1. **Copilot**, reading the diff cold from outside this conversation.
2. **Your reviewer**, in its own worktree, against the acceptance criteria.

They are not redundant. On PR #645 the internal reviewer found a planted-defect
gap, Copilot found caller-overridable ARIA that the reviewer had not looked for,
and SonarCloud found a redundant `act()` neither had. Three instruments, three
disjoint findings. **Wait for all of them.**

**Ready the PR before the internal review, not after.** This diverges from
[`refactor-verified-contract.md`](refactor-verified-contract.md) §7, which readies
on a PASS — deliberately, because readying is the only trigger for Copilot, and
readying afterwards runs the two readers in series for no benefit. The safety
that contract gets from ordering, this one gets from the merge bar: ready is not
merge, and nothing lands until every thread from both readers is resolved.

Spawn one [`refactor-verifier`](../../.claude/agents/refactor-verifier.md) per PR.
Again the prompt is short, and again the short part is load-bearing:

> PR `#<n>`, issue `#<i>`, worktree `<path>`. Post your findings and your verdict
> to the PR.

Give it the issue number so it can read the Scope and Acceptance Criteria for
itself. Give it **nothing** about how the change was built — no summary of the
developer's approach, no plan, no PR body. That is the blindness §1 is about, and
"context" is exactly the wrong thing to add.

The second sentence is the reviewer's dispatch parameter, and it asks for **two**
postings, because a review has two readers. The prose goes where the next human
looks:

```bash
gh pr review <n> --comment --body-file .tmp/epic-<e>/review-<n>.md
```

For line-anchored comments use `gh api repos/{owner}/{repo}/pulls/{n}/reviews`
with a `comments[]` array of `{path, line, body}`.

The **verdict document** goes where the merge bar looks — a timeline comment
whose first line is the marker and the head SHA, which the `Agent review verdict`
check validates against
[`agent-review-contract.md`](agent-review-contract.md) §2.4:

```bash
gh pr comment <n> --body-file .tmp/epic-<e>/verdict-<n>.md
```

**`gh pr review` will not do for the verdict.** A review body is a different
collection that the check does not read, and it fires no `issue_comment` event,
so a verdict posted that way is invisible and cannot refresh a check that has
already reported `absent`. If the reviewer returns a report with no verdict
document, that is a defect in the review — ask for it rather than writing one
yourself, which would make you the reviewer of a change you dispatched.

**The internal reviewer posts `--comment` or `--request-changes`. Never
`--approve`, and never anything that claims to be an approval.** Developer and
reviewer both run under the operator's `gh` token, so GitHub sees one identity
and refuses an approval with `422 Can not approve your own pull request`. That
422 is the two-party control working, not an obstacle to route around: reposting
the same verdict as a comment saying "this is an approval" converts a control
that _stopped_ into a record that reads as one that _passed_ — the exact failure
[§6](#6-how-this-goes-wrong) is about, committed by the agent hired to catch it.

So the internal review is **advisory**, and its PASS is a recommendation to the
orchestrator. The genuinely independent readers are **Copilot** and **the
human**; the merge decision is theirs and the orchestrator's, never an
agent-issued approval.

### Phase 3 — Address and resolve

Every thread — the reviewer's and Copilot's — ends one of two ways:

- **the code changed**, and the reply says which commit; or
- **the finding is wrong**, and the reply says why, with a probe someone else can
  re-run.

Then, and only then, resolve the thread. There is **no third option**: a thread
is never resolved silently, and never resolved because it went `outdated`.

**GitHub marks a thread `outdated` when the line moves. That is not resolution**
and nothing in CI notices the difference. PR #646 merged with three unresolved
Copilot threads, all `outdated=true`, all in fact fixed in code — the fixes
happened, the record does not show it, and
[`merge-checklist.md`](merge-checklist.md) has no box for it. That gap is why this
section exists.

`gh` has no command for resolving a thread. Use GraphQL:

```bash
# List every thread and its state
gh api graphql -f query='
{ repository(owner:"luciocabrera", name:"vite-react-compiler") {
    pullRequest(number: PR) {
      reviewThreads(first:50) { nodes {
        id isResolved isOutdated path
        comments(first:1){ nodes { author{login} body } } } } } } }'

# Resolve one, after it has been answered
gh api graphql -f query='
mutation($t:ID!){ resolveReviewThread(input:{threadId:$t}){ thread{ isResolved } } }' \
  -f t='<thread-id>'
```

**A developer who disagrees with a finding should say so with evidence.** That
behaviour is correct and has twice been right in this repo (see
[§6](#6-how-this-goes-wrong)). Route the disagreement back to the reviewer; if
they still disagree after **two** rounds, escalate — do not let a subagent pair
loop.

### Phase 4 — Merge

Merge only when [the merge bar](#3-the-merge-bar) is fully met, then:

- squash-merge, delete the branch, remove the worktree
- confirm the claim closed (the `coordination-close.yml` workflow deletes the task
  file) and `vp run coordination:verify` reports it gone
- **before removing a worktree, prove it carries nothing unmerged by content
  diff** — `git diff --stat <branch> origin/main -- <paths>` — never by ancestry.
  A squash-merge defeats `--is-ancestor` and the three-dot diff both.
- rebase every remaining open PR in the wave. A PR left `CONFLICTING` **silently
  skips every `pull_request` workflow** — its checks sit "pending" forever and
  nothing says why.

### Phase 5 — Close the wave

Re-read the epic. Merged work usually unblocks issues and often reveals new ones.
Update `.tmp/epic-<n>/plan.md` **and the plan comment on the epic issue** — the
second is the one anyone else can read, and a run that updates only the first
leaves the epic looking exactly as it did before the wave. Report to the human,
then start the next wave.

---

## 3. The merge bar

All of it, every time. Any failure aborts the merge.

- [ ] Every acceptance criterion in the issue is met, or the deviation is stated
      in the PR's Known Limitations
- [ ] **Every review thread is resolved** — reviewer's _and_ Copilot's — each with
      a reply that changed code or refuted the finding. `isResolved: true` for all,
      checked by the GraphQL query above, not by eye
- [ ] Every CI check green, including SonarCloud's strict gate. A local green gate
      does **not** predict Sonar
- [ ] The `Agent review verdict` **commit status** reports `pass` **for the
      commit you are merging** — not the workflow's own row, which is green
      whenever the job ran. It is advisory, so it will not stop you, which is
      exactly why it is on this list. `fail` names a blocking finding, `error`
      means the verdict itself is unusable, and `absent` means nothing answered
      for this head: re-post the verdict, or re-review, but do not merge past it
      silently
- [ ] `mergeable` is not `CONFLICTING`
- [ ] The full [quality gate](../../.github/skills/quality-gate-workflow/SKILL.md)
      passed **on the final commit**, not on an earlier one
- [ ] Docs updated in the **same commit** — ARCHITECTURE, INVENTORY, PATTERNS, ADR
      as the [Documentation Update Rule](../../.github/skills/quality-gate-workflow/SKILL.md#documentation-update-rule) requires
- [ ] A changeset exists if any `@lcabrera/*` package changed
- [ ] [`merge-checklist.md`](merge-checklist.md)'s **[judgement]** items have been
      read by you, not ticked. Its **[auto]** items you confirm ran — you do not
      re-derive them

---

## 4. Parallelism

Two issues may run concurrently when **both** hold:

1. Neither is in the other's `blockedBy`, transitively.
2. Their `area` globs do not overlap — `vp run coordination:verify` warns when
   they do. Run it before dispatching, not after.

When two issues genuinely need each other's work in flight, use a **shared
branch** with a `branches/<slug>.md` descriptor and a named integrator
([coordination README](../coordination/README.md#independent-vs-shared-branches)).
Overlap on a shared branch is collaboration, not collision.

Dispatch all developers in a wave in **one message with multiple tool calls** so
they actually run concurrently.

**Cap a wave at three developers.** Beyond that you are reconciling merge order
more than you are reviewing, and the reviews are what make this worth doing.

---

## 5. When to ask the human

**Escalate — stop and ask:**

- A decision between defensible designs, especially an ADR whose answer changes
  the shape of issues already open in the epic
- Acceptance criteria that contradict each other, the codebase, or another issue
- Work that would grow beyond the issue's stated scope
- A reviewer/developer deadlock surviving two rounds
- Anything needing a credential, an external account, or a published side effect
- A merge that would need a force-push or a bypass of a branch rule
- A finding that suggests already-merged work is wrong

**Decide it yourself — do not ask:**

- Wave composition, ordering, which agent gets which issue
- Technical trade-offs inside an issue's stated scope
- Filing a follow-up issue for something out of scope
- Rebasing, re-running checks, re-dispatching a failed agent

Escalate with a **recommendation**, not a menu. "I propose X because Y; say
otherwise and I'll do Z" beats four options and no opinion.

---

## 6. How this goes wrong

Every item here has happened in this repo.

**Relaying a subagent's claim without probing it.** Two false findings reached a
human report before a developer refuted them: that
`Iterator.prototype.toArray` is non-standard (it is ES2025 — Chrome 122, Node 22),
and that a mock returning `() => {}` yields `{}` (it yields `undefined`; that is a
block body). Both were one command from being checked. **Verify before you
relay, and treat a developer's pushback as a probe to run, not a position to
arbitrate.**

**Trusting a green gate.** A rule that never loaded and code that is correct
produce identical output. This is [AGENTS.md §7](../../AGENTS.md#verifying-a-claim)
and it is the reason the reviewer plants a deliberate violation before certifying
a gate.

**`vp check` is not the gate.** It skips the eslint custom-rules pass, Biome, and
React Doctor. Piping any check through `tail` masks its exit code.

**Hand-merging a generated artifact.** During #569's rebase, hand-merging
`reports/api-surface/ui.txt` would have produced a plausible snapshot silently
missing `TableFocusState`. **Regenerate; never reconcile by hand.**

**Believing a clean rebase means the features compose.** #560 and #569 rebased
cleanly and together produced a live keyboard defect (#651). A rebase is a text
operation. Require an integration check whenever two feature branches touch the
same surface.

**Test-merging with the wrong `git merge-tree`.** The three-argument form
(`git merge-tree <base> <a> <b>`) is the deprecated diff-style output: it prints
**no `CONFLICT` lines at all**, so grepping it for conflicts returns zero on a
pair that conflicts in three files. Use `git merge-tree --write-tree <a> <b>`,
whose output does name them. This reported two wave-2 branches as conflict-free
and the claim was relayed to a developer — a probe that could not detect the
thing it was asked about, which is the same defect the reviewers are told to hunt
for, committed by the orchestrator.

**Assuming a gate saw what it cannot see.** `adr:verify` allocates ADR numbers
against merged history, so two branches in flight both take the same "next free"
number and neither run is wrong. Any gate that reads only the merge base is blind
to siblings — check cross-branch collisions yourself before merging, in generated
indexes and snapshots especially.

**Losing a cross-cutting defect.** When two merged changes are each correct but
their meeting is not, file it against the _meeting_, with attribution as a
command anyone can run (`git show <sha>:<path>`) rather than as an assertion.

---

## 7. Seeding a run

The loop above is the same for every epic. What is never the same is the **state**
of the epic you are about to run: which child gates the rest, which question the
human has not answered, which structural fact makes an otherwise-sensible wave
wrong. A run needs that, and it does not belong in this file.

**The seed lives on the epic issue.** Not here, and not in `.tmp/`. Written here
it would go stale the day the epic closed, and the next epic would inherit another
epic's context as though it were a rule — the exact failure that made this page
name no epic at all. Written only in `.tmp/` it is invisible to everyone but the
one agent that wrote it.

So: **Phase 0 reads the seed, Phase 5 writes it back**, both as comments on the
epic issue. Derive live state with `gh` rather than trusting any number either
one records:

```bash
gh issue view <n> --comments
gh issue list --search "parent:<n>" --state all
```

A useful seed states, in a few lines each:

- **What gates what.** The child whose answer changes the shape of other children
  — usually an open ADR. Name it and say which children move when it lands.
- **Open questions the human owns.** A UX call, a product decision, anything
  Phase 0 would otherwise guess at. Where it is recorded, and which wave must not
  start before it is answered.
- **Structural facts a plan would trip over.** Something the code makes hard today
  that the issue bodies do not mention.

What a seed must **not** contain is a count of closed children, a wave plan copied
from a previous run, or a summary of an issue that is one `gh` call away. Those
are derivable, and a derivable number written down is a number that is wrong later
([AGENTS.md §7](../../AGENTS.md#7-documentation--workflow)).
