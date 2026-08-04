# The `/refactor-verified` contract

> **Canonical for:** the role separation, what the verifier may and may not see,
> the evidence standard, the verdict schema, and the round loop.
>
> The **executable procedure** is the [`refactor-verified`](../../.github/skills/refactor-verified/SKILL.md)
> skill. The **gate sequence** is the [`quality-gate-workflow`](../../.github/skills/quality-gate-workflow/SKILL.md)
> skill. Neither is restated here — this document is the _why_ and the rules of
> evidence, and it is the thing to change when the standard changes.

---

## 1. Why a second agent

An agent that both writes a change and certifies it reads its own diff for
**confirmation**, not for refutation. It knows what it meant, so the diff always
looks like what it meant. It also picks the probe it already believes will pass,
which is the failure AGENTS.md §7 works through in detail: a green run and a rule
that never loaded produce identical output.

Both of this repo's most expensive recurring failures are downstream of that —
changes that fail their own gate after being presented as done, and confident
verdicts drawn from a probe that could not have discriminated. Neither is a
knowledge gap; both were self-caught eventually. What was missing was a reader
who had not already decided.

This workflow supplies one. Its single design commitment:

> **The agent that certifies the change never sees the reasoning that produced
> it.** It is handed the diff and the acceptance criteria, and it must re-derive
> the verdict from those alone.

That is a structural fix, not an exhortation. Non-Negotiable Rule 14 already says
a claim needs evidence that could have disproved it; this dispatches somebody
whose only job is to go looking for that evidence.

---

## 2. The three roles

| Role             | Runs                                           | May see                                                                               | May write                                                            |
| ---------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Orchestrator** | the main session, driving `/refactor-verified` | everything                                                                            | nothing in the worktree — it dispatches, records, and gates the PR   |
| **Builder**      | one subagent per round                         | the issue in full, the repo, the previous round's **verifier** report                 | the worktree: code, tests, docs, the coordination task file, commits |
| **Verifier**     | a **fresh** subagent per round                 | the diff, the issue's §5 and §6, the worktree path — **and nothing the builder said** | nothing durable: it plants, observes, reverts, and returns a report  |

The orchestrator is the only role that holds the whole picture, and it is
deliberately the only role that cannot edit the change. It never relays builder
output into a verifier prompt — that single rule is what the whole mechanism
rests on.

---

## 3. The isolation rule

**Withheld from the verifier**, without exception:

- the builder's report, plan, narration, self-assessment, or confidence
- any orchestrator summary or opinion of the change
- the previous round's verifier report (see §6 — each verifier starts cold)

**Given to the verifier:**

- the worktree path and the base ref
- the issue's **§6 Acceptance Criteria** verbatim, and its **§5 Scope Definition**
  — scope is needed to judge whether an unmet criterion is out of bounds rather
  than missed
- `git diff <base>...HEAD`, produced by the orchestrator, not by the builder

**What unavoidably leaks — and what to do about it.** Code comments, commit
messages, the coordination task file and the draft PR body are all authored by
the builder and all sit inside the diff. Isolation is of the builder's
_reasoning transcript_, not of every sentence the builder wrote. Pretending
otherwise would be the more dangerous position, so the contract states it and
draws the line where it actually holds:

> A verifier that accepts a comment's, commit message's or PR body's claim as
> evidence has been captured. Prose inside the diff is a **claim under review**.
> Evidence is an observation the verifier produced itself.

A builder comment reading "this cannot be null here" is a criterion to test, not
a finding to record.

---

## 4. The evidence standard

Every criterion in the issue's §6 gets its own line in the verdict, and every
line carries three things:

1. **Outcome** — `met` or `not-met`. There is no "probably".
2. **Method** — `gate` (a command that exits non-zero when the criterion is
   violated) or `inspection` (the verifier read the change and judged).
3. **The falsifier** — the observation that _would have_ shown the criterion
   unmet, and confirmation that it was looked for. A line without this is not a
   verification; it is an assertion in a table.

### The planted violation

At least one criterion must be established by `gate`, and a `gate` claim is only
admissible with a demonstrated **fail→pass pair**:

1. Confirm the tree is committed and clean.
2. Plant a violation that breaks **the specific behaviour that criterion
   asserts**.
3. Run the gate. Record the command, its exit code, and the message it printed.
4. Revert the plant. Re-assert `git status --porcelain` is empty.
5. Run the same gate on the clean tree. Record that it passes.

> **The plant must discriminate.** Planting a `debugger` statement and watching
> Oxlint fail proves the linter runs. It proves nothing about the criterion.
> This is the same mistake AGENTS.md §7 works through — a probe whose failure
> and success are explained equally well by the thing you are testing and by
> something else entirely tells you nothing. Ask before planting: _what else
> would produce this same failure?_ If the answer is "the gate would fail on
> this plant even if the change had never been made", pick a different plant.

**PASS requires** every criterion `met` **and** at least one criterion carrying a
demonstrated fail→pass pair.

If no criterion admits a gate — possible for a purely editorial change — the
verdict is `PASS (inspection-only)`, and the orchestrator must surface that
wording to the user rather than reporting a plain PASS. It is a weaker
guarantee and it should read as one. This is an escape hatch for the genuinely
ungateable, not a shortcut for the merely inconvenient: the repo's verify gates,
the linters, `skills:validate`, `docs:verify` and the test suite between them
gate almost everything, including documentation.

---

## 5. The verdict schema

The verifier returns exactly this, and nothing that contradicts it:

```
VERDICT: PASS | PASS (inspection-only) | FAIL

## Criteria
| # | Criterion (abbreviated) | Outcome | Method | Falsifier looked for |
|---|------------------------|---------|--------|----------------------|
| 1 | …                      | met     | gate   | …                    |

## Gate proof
Criterion: <which one>
Plant:     <the edit made, and why it targets THIS criterion and not the toolchain>
Failed:    <command> → exit <n>
           <the message it printed>
Reverted:  git status --porcelain → empty
Passed:    <command> → exit 0

## Findings
(FAIL only — one per unmet criterion: what is wrong, where, and what would fix it.
 Never a patch: the builder writes the code.)

## Out of scope
(anything noticed that §5 of the issue excludes — recorded, not counted against the verdict)
```

---

## 6. The round loop

```
builder → verifier → PASS?  ─ yes ─→ mark PR ready
                       │
                       no
                       ↓
             round < 3 ? ─ yes ─→ builder (given the FAIL findings)
                       │
                       no
                       ↓
             stop: no ready PR, worktree preserved, report all rounds
```

Three properties of the loop are load-bearing:

- **Isolation is one-directional.** The builder _does_ receive the verifier's
  findings — that is the feedback that makes the loop converge. The verifier
  never receives anything the builder said.
- **Each round spawns a fresh verifier, with no memory of the last one.** A
  verifier told "criterion 3 failed last time" checks criterion 3 and
  rubber-stamps the other four. Re-deriving from cold every round is the point,
  and it costs a round's worth of re-reading to buy it.
- **Exhaustion is not a failure to report as success.** After the third FAIL the
  work stays on the branch, the PR stays draft, and the orchestrator hands the
  user every round's verdict. Three rounds is a **cost** bound; it says nothing
  about whether the change is close.

---

## 7. The PR gate

The rule is that a change is not put up for review until a verifier has passed
it. In this repo that is implemented as **`gh pr ready`, not `gh pr create`**:

`vp run coordination:claim` already opens a draft PR at claim time — deliberately,
because the draft is the human-visible progress surface the coordination protocol
depends on — and `gh pr create` on an already-claimed branch silently returns the
existing URL and discards the title and body it was given.

So across the whole run:

- **From claim to PASS** the PR exists, stays **draft**, and carries the claim's
  placeholder description.
- **On PASS** the orchestrator writes the real title and body with `gh pr edit`,
  then `gh pr ready`.
- **On exhaustion** neither happens. A draft PR with a placeholder body is the
  correct visible state for work that did not pass.

Nothing in this workflow merges. Review is still a human's.

---

## 8. Safety invariants

The verifier deliberately edits a tree it does not own, so the guarantees that
keep that from costing work are part of the contract, not the implementation:

1. The verifier refuses to start unless `git status --porcelain` is empty. An
   uncommitted builder change would otherwise be indistinguishable from a plant.
2. Every plant is reverted before the next one, and cleanliness is re-asserted
   after each revert — not just at the end, so a crash mid-run leaves at most one
   plant behind.
3. The verifier never commits, pushes, marks ready, closes, or merges.
4. The orchestrator re-asserts the tree is clean when the verifier returns, and
   treats a dirty tree as a FAIL of the run rather than of the change.

---

## 9. When not to use this

- **A one-line fix you would commit immediately.** The loop costs more than the
  change; Rule 12 does not even require a claim for it.
- **An issue with no §6.** The workflow's ceiling is the issue's acceptance
  criteria — vague criteria buy vague verification. Fix the issue first.
- **Exploration.** There is nothing to certify until there is a change with a
  stated bar. Use `codebase-explorer`.

---

## 10. Known limitations

- **Builder prose reaches the verifier through the diff** (§3). The contract
  handles it by rule, not by mechanism.
- **Both agents are the same model family**, so this buys independence of
  _context_, not of _capability_. A blind spot both share survives the loop. It
  is a strictly better position than one agent grading itself, and strictly worse
  than a second pair of eyes.
- **The verifier can only test what the criteria state.** A regression nobody
  wrote a criterion for passes.
- **Three rounds is a budget, not a verdict.** Exhaustion means "stop spending",
  and the change may be one small fix from passing.

---

## Related

- AGENTS.md §5 — Rule 12 (claim before you touch), Rule 14 (the evidence standard)
- AGENTS.md §7 "Verifying a claim" — the discriminating-probe worked failures
- [`docs/coordination/README.md`](../coordination/README.md) — the claim protocol the builder follows
- [`docs/agents/workflow.md`](./workflow.md) — the issue/PR standard the run has to satisfy
