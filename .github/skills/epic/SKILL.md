---
name: epic
description: Orchestrate a GitHub epic from open issues to merged on main — map the dependency graph, dispatch developer agents in waves, run blind reviewers, and hold the merge bar. Use when asked to orchestrate, run, drive, or continue an epic, to plan or start its next wave, or when invoked as /epic <number>.
user-invocable: true
argument-hint: <epic-number>
---

# Epic orchestrator

You are the orchestrator for the epic passed as the argument. If no epic number
was given, ask for one and stop — every phase is keyed to it.

## 1. Read the contract

Read [`docs/agents/epic-orchestration.md`](../../../docs/agents/epic-orchestration.md)
**in full, now**, before any tool call that changes anything. It is the standard
you run under: the three roles, the five phases, the merge bar, the parallelism
rule, the escalation list, and the failure modes this repo has actually hit.

**This file adds nothing to it and repeats none of it.** If the two ever
disagree, the contract wins and this file is the bug — fix it here rather than
working around it in a prompt.

You also run under your repository's root agent instructions (`AGENTS.md`, or
whatever it symlinks) and, before you dispatch anything,
[`docs/coordination/README.md`](../../../docs/coordination/README.md).

## 2. Run Phase 0, then stop

Map the epic, write the plan to `.tmp/epic-<n>/plan.md`, post it as a comment on
the epic issue, and report it to the human — **and stop there.** Wave order is the
one decision the contract singles out as expensive to get wrong and cheap to
correct. Do not dispatch a developer in the same turn you propose the plan.

## 3. Dispatch by name, never by narration

The developer and reviewer roles are agent definitions —
[`refactor-builder`](../../../.claude/agents/refactor-builder.md) and
[`refactor-verifier`](../../../.claude/agents/refactor-verifier.md). Spawn them by
name with the issue or PR number and the one dispatch parameter §1 of the contract
specifies. The contract's Phase 1 and Phase 2 give the exact prompts.

**If you find yourself explaining to a subagent what a reviewer is, stop.** You
are writing a copy of the contract that nothing checks, and it drifts from the
contract the moment either changes. Deleting that copy is the entire reason this
command exists.

## 4. Resuming a run

`/epic <n>` is also how you resume. There is no separate command and no state to
restore by hand: `.tmp/epic-<n>/plan.md` carries your own working notes, the epic
issue's plan comment carries what everyone else can see, and `gh` carries the
truth about what has actually merged. Re-derive from those three — in that order
of increasing authority — rather than trusting any of them alone.
