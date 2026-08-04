---
name: refactor-verified
description: Implement a backlog issue with an independent verifier — a builder subagent writes the change, a separate verifier subagent certifies it from the diff and acceptance criteria alone, and the PR is only put up for review after it passes. Use for refactors and fixes with testable acceptance criteria. Invoke as /refactor-verified <issue-number>.
user-invocable: true
---

# /refactor-verified &lt;issue-number&gt;

Implements one backlog issue through a **builder** subagent, then certifies it
through a **verifier** subagent that never sees the builder's reasoning. FAIL
loops back to the builder, up to three rounds. The PR is put up for review only
after a PASS.

You are the **orchestrator**. You dispatch, you record, you gate the PR — you do
not edit the change yourself.

> The rules of evidence, the isolation rule, the verdict schema and the round
> loop are owned by
> [`docs/agents/refactor-verified-contract.md`](../../../docs/agents/refactor-verified-contract.md).
> **Read it first.** This file is the procedure; that file is the standard, and
> when they seem to disagree it wins.

## Before you start

1. `gh issue view <n>` — confirm it has a **§6 Acceptance Criteria** section with
   binary, testable items. If it does not, stop and say so: the verifier's
   ceiling is §6, and vague criteria buy vague verification. Offer to fix the
   issue first.
2. `vp run coordination:verify` — confirm nothing active already owns the area.
3. Confirm the issue is a fit at all — see the contract's §9 for when this
   workflow is the wrong tool.

## The loop

### Round `r` (1…3)

**1. Dispatch the builder.**

Use `subagent_type: refactor-builder`. On round 1 the prompt is the issue number
plus the claim parameters. On rounds 2–3 it is the same, plus the previous
verifier's **Findings** section verbatim — and nothing else from that report.

```
Implement issue #<n>. Round <r> of 3.

<round 1 only>
Claim it first: vp run coordination:claim -- <id> "<title>" --issue <n>
  --type <type> --area <glob> ...
Then bootstrap the worktree it creates, implement, run the full gate, commit and push.

<rounds 2+ only>
The change is on branch <branch> in <worktree>. An independent verifier failed it.
Its findings follow. Fix the underlying causes, re-run the full gate, and commit.
If a finding is wrong, say so with evidence and change nothing.

<verifier Findings section, verbatim>
```

**2. Capture the diff yourself.** Do not ask the builder for it.

```bash
cd <worktree> && git status --porcelain && git diff origin/main...HEAD
```

A non-empty `git status` is a builder error — send it back before verifying.

**3. Dispatch the verifier.** Use `subagent_type: refactor-verifier`, **a fresh
one every round**. Compose the prompt from exactly four inputs:

```
Certify the change in <absolute worktree path> against issue #<n>.

Base: origin/main    Branch: <branch>

## Acceptance criteria (issue §6, verbatim)
<paste>

## Scope (issue §5, verbatim)
<paste>

## The diff
<paste `git diff origin/main...HEAD`, or give the exact command if it is large>

Read docs/agents/refactor-verified-contract.md, then follow it. Return the §5 schema.
```

> **This is the step the whole workflow rests on.** Nothing the builder wrote —
> its report, its round summary, its confidence, its explanation of a tricky bit
> — goes into this prompt. Not as background, not as "for context", not
> paraphrased. If you find yourself typing "the builder says", stop.
>
> Do not pass the previous round's verifier report either. Each verifier starts
> cold, on purpose (contract §6).

**4. Read the verdict.**

- `PASS` → go to **Ship**.
- `PASS (inspection-only)` → go to **Ship**, and report those exact words to the
  user. It is a weaker guarantee than a PASS and must not be relayed as one.
- `FAIL` → if `r < 3`, increment and dispatch the builder again. If `r = 3`, go
  to **Exhausted**.

**5. Re-assert the tree is clean.** `git status --porcelain` in the worktree must
be empty after the verifier returns — it plants violations and is required to
revert them. A dirty tree is a failure of the **run**, not of the change: report
it, restore the tree, and do not ship on that round.

### Ship (only after a PASS)

The draft PR already exists — `coordination:claim` opened it, and `gh pr create`
on a claimed branch silently discards your title and body (contract §7). So:

```bash
gh pr edit <pr> --title "<type>(<scope>): <subject>" --body-file <path>
gh pr ready <pr>
```

Write the body with the [`commit-and-pr`](../commit-and-pr/SKILL.md) skill —
every section of the PR template, and put the verifier's gate proof in
**Verification**. That block is the strongest evidence the PR has: it is a
fail→pass pair produced by someone who did not write the code.

Then update the coordination task file: `status: review`, `pr:`, `updated:`.

Do not merge.

### Exhausted (three FAILs)

Stop. Leave the branch, the worktree and the draft PR exactly as they are — the
work is not wrong, it is unverified, and destroying it loses three rounds of
effort.

Report to the user: every round's verdict, which criteria never went `met`, and
whether the failures converged (different criteria each round) or stalled (the
same one). A stall usually means the criterion is wrong, not the code.

## Reporting to the user

At the end of every run, give:

|                |                                                          |
| -------------- | -------------------------------------------------------- |
| **Issue / PR** | `#<n>` / `#<pr>`                                         |
| **Rounds**     | how many, and each round's verdict                       |
| **Verdict**    | PASS / PASS (inspection-only) / EXHAUSTED                |
| **Gate proof** | the criterion, the plant, and the fail→pass pair         |
| **Unverified** | criteria the verifier could only establish by inspection |

Report the gate proof in full even on a PASS. It is the part a reader cannot
reconstruct, and it is what separates this from a green run.

## Failure modes to watch for

- **A verifier that only ran the gate.** Re-running the quality gate is step 4 of
  its procedure, not the verification. If its report has no per-criterion
  falsifier column, it did not verify — send it back.
- **A plant that tests the toolchain.** A `debugger` statement failing Oxlint
  says the linter runs. If the plant would fail identically on `main`, the proof
  is void (contract §4).
- **A builder that fixed the probe.** Between rounds, check that the new commit
  addresses the cause the finding pointed at, not just the symptom the verifier
  happened to observe.
- **Leaked context.** If a verifier report references something only the builder
  could have known, the prompt was contaminated. Discard the verdict and re-run
  that round.

## Related

- [`docs/agents/refactor-verified-contract.md`](../../../docs/agents/refactor-verified-contract.md) — the standard
- [`quality-gate-workflow`](../quality-gate-workflow/SKILL.md) — the gate both agents run
- [`commit-and-pr`](../commit-and-pr/SKILL.md) — the enforced commit/PR format
- [`docs/coordination/README.md`](../../../docs/coordination/README.md) — the claim protocol
