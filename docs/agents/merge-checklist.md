# Merge Checklist

Verify every item before merging. **If any item fails, abort the merge.**

Items marked **[auto]** are already enforced by CI or a git hook — the check
name is given so you can confirm it ran rather than re-derive it by hand. Items
marked **[judgement]** are the ones no machine can decide; those are the reason
this file exists.

Restating an enforced check as a hand-ticked box is how a checklist rots: it
reports the same green whether it was read or skipped. Where a box is automated,
trust the check and look at its output.

## Pre-merge requirements

- [ ] **PR description fully completed** — every heading present, none deleted
      **[auto: PR Standards / `pr:verify`** for the sections
      `commit-convention.mjs` lists as required; **judgement** for whether each
      one says anything]
- [ ] **Issue acceptance criteria satisfied** — each box in the linked issue is
      met, or the deviation is explained in the PR **[judgement]**
- [ ] **No unexplained deviations from issue scope** — anything outside the
      issue's In Scope list is called out in Known Limitations **[judgement]**
- [ ] **All tests passing** **[auto: Unit Tests & Coverage]**
- [ ] **New tests added for new logic** — and they fail without the change
      **[judgement]**
- [ ] **No regressions** **[auto: Unit Tests & Coverage, Quality Gate,
      Fallow Audit (new-only)]**
- [ ] **Documentation updated** per the Documentation Update Rule in the
      [`quality-gate-workflow` skill](../../.github/skills/quality-gate-workflow/SKILL.md#documentation-update-rule)
      **[judgement; auto for paths: `docs:verify`]**
- [ ] **No conflicting approaches introduced** — no second way to do something
      the repo already does one way **[judgement]**
- [ ] **An accepted reviewer has reviewed the current head commit** — not merely
      the pull request at some earlier point **[auto: `Copilot review complete`]**.
      The status is green only while some accepted reviewer's own newest review
      names the head SHA, so a push after a review takes it back to `pending`. Two
      reviewers are accepted and either one covering the head is enough; the
      context keeps its original name. What each state means, when a stale review
      reports `failure` rather than `pending` — it needs every accepted reviewer to
      have spoken — and the break-glass path for when nobody reviews are in
      [`copilot-review-gate.md`](../tooling/copilot-review-gate.md). It is a
      required context, so it blocks the merge — a head with no accepted review
      does not go in.
- [ ] **Every review thread is addressed and resolved** — whoever opened it
      **[auto: `Review threads resolved`; `vp run pr:threads -- --pr <n>` exits 0]**.
      Each ends with a fix naming its commit, or a reply refuting the finding
      with a re-runnable probe; `outdated` is not resolution. The `main` ruleset
      blocks the merge on this, and says so only in the merge box — #646 and
      #780 are what the box not being read costs. The rule is
      [`pr-review-threads.md`](pr-review-threads.md).
- [ ] **Reviewed by a supervising agent or human** **[judgement]**. Where an
      agent code review has reported a verdict on the PR, what that verdict has
      to satisfy — which severities block, and the only sanctioned way to merge
      past a blocking finding — is
      [`agent-review-contract.md`](agent-review-contract.md). An unparseable
      verdict is an `error` there, never a pass.
- [ ] **The `Agent review verdict` commit status reports `pass` for the commit
      being merged** **[judgement — the check is advisory and cannot stop you,
      which is why it is on this list]**. It validates a verdict rather than
      producing one, so read its description: `fail` names a blocking finding,
      `error` means the document itself is unusable, and `absent` means no review
      answers for this head — not a failure, and not a review either. A verdict
      expires on every push (contract §2.5), so a `pass` on an earlier commit
      says nothing about this one. The workflow's own row
      (`Publish the agent review verdict status`) is green whenever the job ran
      and says nothing about the verdict — the two are deliberately named apart.
- [ ] **Impact analysis completed** — the PR's Impact Analysis section is filled
      in, not "N/A" by default **[judgement]**
- [ ] **Security / privacy implications reviewed**
      **[auto: Secret scan, Strict Sonar issue gate; judgement for the rest]**
- [ ] **Performance implications reviewed** **[judgement]**

## Final merge gate

- [ ] **Does not revert or contradict previous agent work** — check the
      coordination register and any overlapping active claim
      (`vp run coordination:verify`) **[judgement]**
- [ ] **Does not introduce ambiguity for future agents** — no rule that
      contradicts `AGENTS.md`, no convention stated in two places
      **[judgement]**
- [ ] **Aligns with the orchestration rules** in
      [`workflow.md`](workflow.md) **[judgement]**

## What the automated checks are

Run locally by the [`quality-gate-workflow`](../../.github/skills) skill, and in CI
by [`check-safe.yml`](../../.github/workflows/check-safe.yml) and
[`pr-standards.yml`](../../.github/workflows/pr-standards.yml). The canonical
command list is [`COMMANDS.md`](../../COMMANDS.md).

[`copilot-review-gate.yml`](../../.github/workflows/copilot-review-gate.yml) is
the odd one out: it judges the **review**, not the code, so it is recomputed by
review and head-commit events rather than by the gate command, and its verdict
changes when nothing in the diff has.

### The two review checks cover different pull requests

They look like a pair and are not interchangeable. Which one answers for your pull
request depends on how it was opened.

| Check                     | Covers                                                                                                       | Green means                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `Copilot review complete` | **every ready pull request** — `claude-review.yml` reviews all of them, skipping drafts (which cannot merge) | some accepted reviewer reviewed **this head commit**. Not that anyone approved. |
| `Agent review verdict`    | only pull requests carrying acceptance criteria — `/epic` and `/refactor-verified`                           | where criteria existed, each was met and carries a falsifier                    |

**A pull request with no verdict merges, and that is deliberate.** Open one by hand
— a docs fix, a dependency refresh, a coordination claim — and `Agent review verdict`
reports `absent` and does not stop you. It is a stated bypass rather than an
oversight: making every pull request carry a verdict would mean inventing acceptance
criteria for pull requests that have none, which costs more than the coverage is
worth. The reasoning is
[§2.3 of the review contract](agent-review-contract.md) and the decision is #855.

What that leaves uncovered is narrower than it sounds: the review those pull requests
do get is the one `Copilot review complete` reads. The verdict check adds criterion
evidence on top; it is not the only thing looking.

A green PR means those ran — it does not mean the **[judgement]** items were
considered. That is the gap this checklist covers.
