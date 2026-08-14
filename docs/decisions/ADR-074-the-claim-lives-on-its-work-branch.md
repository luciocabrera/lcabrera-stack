# ADR-074 — A claim lives on its work branch; cross-branch visibility is the check's job

- **Status:** Accepted
- **Date:** 2026-08-14
- **Issue:** [#704](https://github.com/luciocabrera/vite-react-compiler/issues/704)
- **Corrects:** the "claim lives on `main`, landed early" rule in
  [`docs/coordination/README.md`](../coordination/README.md), written before
  [#233](https://github.com/luciocabrera/vite-react-compiler/issues/233) and left
  standing after it.
- **Relates to:** [ADR-036](ADR-036-github-planning-layer.md) (the durable backlog
  this register links to), [ADR-037](ADR-037-coordination-board-is-a-local-view.md)
  (the same "do not put a shared artifact on `main`" pressure, resolved for the
  board).

## Context

`docs/coordination/README.md` carried two live statements about where a claim
lands, roughly a hundred lines apart, and they contradicted each other:

- a rule saying a task file is a shared lock **only once it is on `main`**, so
  `tasks/<id>.md` should be committed to `main` first, in a claim-only PR
  separate from the work branch;
- a section explaining that the overlap check reads every live branch on
  `origin` **because** `coordination:claim` commits the task file onto the branch
  it creates, "so a claim is off-`main` from the moment it exists".

The second describes what the tooling does. `scripts/coordination-claim.sh`
branches off `origin/main`, writes the task file, commits it onto that branch,
pushes, and opens a draft PR. No PR in this repository has ever landed a
claim-only commit on `main`, and `git show origin/main:docs/coordination/tasks/`
lists only `_TEMPLATE.md`.

The first was written when the check read the working tree only. #233 removed
its premise: the register now reads claims from the live remote branch list, so
"no one sees them until merge" stopped being true and the rule outlived the
problem it was solving.

## Problem

A documented rule nothing implements is not inert. It is read, and acted on.
Copilot's review quoted it verbatim on two unrelated PRs
([#702](https://github.com/luciocabrera/vite-react-compiler/pull/702),
[#718](https://github.com/luciocabrera/vite-react-compiler/pull/718)) and asked
in both that the task file be split into a separate claim-only PR. It read the
protocol correctly each time. Because every PR that `vp run coordination:claim`
produces carries its own task file, that finding recurs on every claim and costs
a review round to answer.

## Decision

**The claim lives on the branch it locks, from the moment that branch exists.**
`coordination:claim` commits `tasks/<id>.md` onto the work branch it creates;
there is no claim-only PR and no claim commit on `main`. A claim reaches `main`
when the work merges — at which point `coordination-close.yml` deletes it.

**Cross-branch visibility is the check's job, not `main`'s.**
`vp run coordination:verify` takes the live branch list from the remote and
reads each branch's claims out of the object store, so two unmerged branches are
compared against each other. Its failure mode is reported rather than silent: a
live branch it could not read is counted as **unread**, not skipped
(`scripts/lib/coordination-remote.mjs`).

**Nothing gates the placement.** No check asserts that a task file is absent
from `main`, or present on a branch. A gate on the first would fail every PR the
repo's own tooling produces; the property actually worth keeping honest — that
every live claim was compared — is already carried by the unread-branch warning
above.

## Consequences

- The register is one PR per piece of work again: the claim and the work it
  describes travel together, and the claim is deleted by the same merge that
  lands the work.
- **A claim is invisible to a reader who never fetches a branch.** Browsing
  `docs/coordination/tasks/` on `main` in the web UI shows only `_TEMPLATE.md`,
  now and permanently. That is the real cost of this decision, and it is paid by
  humans more often than by agents.
- What covers that reader instead is deliberately not the task file: the draft PR
  `coordination:claim` opens at claim time, `vp run coordination:board:live`
  (which joins the claims with live PR state), and the linked backlog issue,
  self-assigned at claim time so its Planning-board card moves to In Progress
  before any code exists (ADR-036).
- Anyone reading the register from a stale checkout gets a warning rather than a
  wrong answer, but they do have to run `git fetch --prune` to clear it.
- Because the comparison runs between claims on live branches, all of the
  register's false-positive pressure lands on glob width: two disjoint tasks
  whose `area` globs are directory-level collide by construction. That is
  [#712](https://github.com/luciocabrera/vite-react-compiler/issues/712), kept
  separate — it is about how narrow a glob should be, not about where the file
  lands.

## Alternatives considered

The letters are #704's own: **(b)**, correcting the README to describe the
one-branch flow, is the Decision above. These are the two it beat.

**(a) Land the claim on `main` first, in a claim-only PR, and keep the work
branch free of task files.** Rejected on the mechanics, not on taste. `main`
carries a ruleset with a `pull_request` rule and `required_status_checks` — read
the live list with
`gh api repos/luciocabrera/vite-react-compiler/rules/branches/main` — so:

- a direct push of the claim is refused outright — GitHub answers `GH013`,
  naming the required checks it is still expecting (the same wall that killed the
  removed `update-changelog.yml`);
- the PR form works, but the claim does not exist until a full CI run has gone
  green, which is after the moment the lock is supposed to precede — and it costs
  a second PR, a second review, and a `main` commit (hence another `check-safe`
  run) for every task;
- the automated form works too — `coordination-close.yml` already pushes to
  `main` with the admin PAT that may bypass the ruleset — but it moves claim
  creation onto a workflow round-trip and a privileged token, so the lock exists
  only once GitHub says so, and an agent working offline or from a fork cannot
  make one at all.

What (a) buys is the web-visible claim recorded under Consequences. It is not
nothing; it is bought more cheaply by the draft PR and the assigned issue.

**(c) Make `coordination:verify` fail a task file that is on a branch but not on
`main`.** This is the only thing that would have kept rule 2 honest, and it is
why the rule stayed inert instead of failing loudly for as long as it did. It is
rejected with (a): a gate enforcing a flow the tooling cannot produce would fail
every claim PR, and the register's warnings are deliberately non-blocking so that
one agent's drifting task never fails another's build.

## References

- [#704](https://github.com/luciocabrera/vite-react-compiler/issues/704) — the
  contradiction, its two measured comments, and the option table this settles
- [#233](https://github.com/luciocabrera/vite-react-compiler/issues/233) — the
  tree-only check that reported a clean register to both sides of a real
  collision; the reason the remote read exists
- [#711](https://github.com/luciocabrera/vite-react-compiler/issues/711),
  [#712](https://github.com/luciocabrera/vite-react-compiler/issues/712) — the
  other two members of the family: `area` is hand-written intent, not observed
  outcome
- [`docs/coordination/README.md`](../coordination/README.md) — the protocol this
  ADR now backs
- `scripts/lib/coordination-remote.mjs` — the remote read, and its "reported, not
  skipped" rule
