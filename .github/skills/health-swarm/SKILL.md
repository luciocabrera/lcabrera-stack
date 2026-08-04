---
name: health-swarm
description: Run a parallel codebase-health sweep — six read-mostly scout subagents (duplication, dead code, perf, deps, doc drift, lint coherence), each filing evidence-backed findings classified MECHANICAL or JUDGMENT. Use for a periodic audit, before a large refactor, or when asking "what has rotted here".
argument-hint: 'Optional scout subset, for example: perf deps, or lint-coherence. Omit to run all six.'
user-invocable: true
---

# Codebase health swarm

## Outcome

A prioritized set of findings, each with a re-runnable repro, evidence that
could have disproved it, a blast radius, and a MECHANICAL/JUDGMENT
classification — filed as GitHub issues, with the mechanical ones fixed in
PRs.

**Findings are worthless unless they are true.** A sweep that files twelve
plausible-sounding issues is worse than one that files three verified ones plus
a list of what it ruled out, because someone acts on each of the twelve without
re-deriving it. Optimize for that, not for volume.

## Before dispatching

1. **Read `references/evidence-standard.md` and `references/known-traps.md`.**
   Every scout is held to the first; the second is what stops a scout
   confidently "fixing" something deliberate.
2. **Fetch the open issues** — `gh issue list --state open --limit 100 --json
number,title,body`. Pass the list into every charter. Without this the sweep
   refiles what is already tracked, which is the fastest way to make it
   unwelcome.
3. **Check the register** — `vp run coordination:verify`. Do not sweep an area
   another agent is actively changing.
4. **Confirm the primary checkout is on `main`** and clean.

## Dispatch

Spawn the scouts **in parallel, in one message**. Each gets: its charter file,
both references, the open-issue list, and a scratchpad path to write findings
to.

| Scout          | Charter                      | Isolation                            |
| -------------- | ---------------------------- | ------------------------------------ |
| DUPLICATION    | `charters/duplication.md`    | shared checkout, read-mostly         |
| DEAD CODE      | `charters/dead-code.md`      | shared checkout, read-mostly         |
| PERF           | `charters/perf.md`           | shared checkout, read-mostly         |
| DEPS           | `charters/deps.md`           | **own git worktree**                 |
| DOC DRIFT      | `charters/doc-drift.md`      | shared checkout, read-mostly         |
| LINT COHERENCE | `charters/lint-coherence.md` | shared checkout, `.tmp/` probes only |

**DEPS must be isolated.** Its charter is a clean from-scratch install; running
that in the shared checkout destroys `node_modules` under the other five
mid-flight.

Scouts are **read-mostly**: no edits to the working tree, no git mutations, no
`gh` writes, no installs. Their only writes are the scratchpad and — for LINT
COHERENCE — probe files under `.tmp/`, deleted before it reports.

Run a subset when the argument names one. A targeted `perf deps` sweep is often
the right call — a full six-scout sweep is expensive, and most of its cost goes
into re-deriving the same ruled-out hypotheses each charter already records.

## Verify before filing

**Do not file a scout's finding on its word.** Re-derive every load-bearing
claim yourself. This is the step that earns the sweep its credibility, and it
has already paid: in the first sweep the DOC DRIFT scout attributed four dead
links to a subtle filter bug, and checking it directly showed the real cause was
a blanket `/decisions/` substring exemption hiding 72 files — a much larger
finding, and a different fix.

Then:

- **Dedupe** against the open issues, including partial overlap.
- **Downgrade** anything whose probe does not discriminate. An unmeasured perf
  hypothesis is not a JUDGMENT finding; it is not a finding.
- **Validate every issue body** — `node scripts/verify-issue-body.mjs
--body-file <path>`. It refuses paths outside the repo, so stage drafts in
  `.tmp/` rather than a system temp dir.

File **one issue per scout**, enumerating that category's findings. One issue
per finding floods the tracker; one issue per category matches the repo's
one-claim-per-PR workflow and gives each fix PR something to close.

## Fixing the MECHANICAL findings

Follow the normal contribution path — `commit-and-pr` and
`quality-gate-workflow` own the detail. Three things specific to this work:

- **Claim first.** A task file per PR (`docs/coordination/tasks/`), with the
  `issue:` field as a full URL — a bare `#123` is a YAML comment and a quoted
  one fails the parser. Delete the claim when the PR merges.
- **Work in a worktree**, never on a branch in the primary checkout.
- **Group by defect family, not strictly by category.** If a family spans two
  scouts, one PR. The first sweep found eight dead config files split across
  the LINT and DEAD CODE scouts; splitting them would have repeated PR #420,
  which deleted a directory and left every file referencing it.

**Prefer a gate over a fix wherever the defect is a class rather than an
instance.** A gate fails the PR that reintroduces the problem, forever, at no
recurring cost — which is worth far more than finding it again next sweep. The
pattern is remove-then-gate, established by `viteplus:verify` and followed by
`configs:verify`. And per Rule 14, **prove the gate fires**: plant a real
violation, watch it fail, revert. A gate only ever seen passing is
indistinguishable from one that never runs.

## Reporting

Rank by consequence, not by category or count. Say plainly what was **ruled
out** — a disproven hypothesis is a real result and stops the next sweep
re-deriving it. Name what you did not do.
