---
governs:
  - repository
---

# ADR-147 — Suppress a finding only after a blind panel confirms a false positive

**Status:** Accepted

**Date:** 2026-10-30

**Issue:** [#1554](https://github.com/luciocabrera/lcabrera-stack/issues/1554)

**Amends:** [ADR-095](ADR-095-move-explanations-out-of-functions-and-into-the-record-that-owns-them.md) and [ADR-104](ADR-104-the-no-comment-rule-covers-a-type-declaration.md). Both name the comments the no-comment rule exempts. This adds one: the one-line reason on a false-positive marker. Nothing else in either changes.

**Relates to:** [`AGENTS.md`](../../AGENTS.md) §5 Rule 11, [`docs/agents/public-package-suppressions.md`](../agents/public-package-suppressions.md), [#1549](https://github.com/luciocabrera/lcabrera-stack/issues/1549)

## Context

Rule 11 says a finding is fixed and never suppressed. The public packages are
held to it most strictly: no baseline, no scoped rule-off, no inline disable.

Some analyzers report candidates, not verdicts. fallow calls its `security` and
`similar-code` findings candidates to verify. When one of them is wrong, Rule 11
leaves two exits. The builder can bend correct code until the analyzer stops
reporting it, or argue the finding away. Bending the code makes it worse to
satisfy a tool. Arguing fails because the builder is the one party that wants
the finding gone, so a builder who rules on its own finding usually dismisses
it.

## Decision

A finding is suppressed only when a blind panel has ruled, unanimously, that
it is a false positive. This holds everywhere, the public packages included,
and for every analyzer that has an inline marker: fallow, ESLint, Oxlint, Biome
and React Doctor. There is no other exception. A public package still takes no
baseline and no marker the panel did not confirm.

1. **Fix it first.** If a small restructure clears the finding without making
   the code worse, that is the answer.
2. **Open a case.** `vp run adjudicate -- <analyzer> <file>:<line>[-<end>]:<rule>`
   re-runs the analyzer and keeps the finding only if it is still reported. It
   writes `docs/agents/adjudications/FP-nnnn/case.json`: the finding as the
   analyzer prints it, the analyzer's own explanation and trace where it has
   them, the flagged code with its context, and the sha256 of the flagged
   lines. The command takes no free text, so the builder's reasoning cannot
   reach it.
3. **Run the panel.** `vp run adjudicate:panel -- FP-nnnn --builder-model <id>`
   starts three sessions in parallel through the Claude subscription, each on
   its own model, each given only the case file path: `fp-judge` twice and
   `fp-adversary` once (`.claude/agents/`). The three are distinct models, so at
   least two of them differ from the builder's. The builder's model cannot be
   kept off the panel outright: there are only three model families, and the
   panel needs three distinct seats. `--builder-model` is recorded in the
   envelope as `builder_model`, so the verdict history shows when the builder's
   model sat; the history database does not store that field yet. Each session
   runs in a `git archive`
   export of the case's commit, never in the repository, and the command voids
   the panel if the repository's working tree changed while they ran.
4. **Read the verdicts.** Each verdict file starts with `REAL` or
   `FALSE_POSITIVE` on line one. A REAL carries a `Fix:`. A FALSE_POSITIVE
   carries a `Check:` that could have shown the finding real (Rule 14): the
   caller, input or configuration under which the rule would fire, and the
   files, by path, searched for it. The command refuses a `Check:` that names
   no path.
5. **Decide.** Three FALSE_POSITIVE: the case is dismissed. The command writes
   the envelope to `docs/agents/adjudications/FP-nnnn.json`, an upstream draft
   beside the case, and an entry in `docs/agents/false-positives.json` that
   expires at most six months after the case opened. The builder adds the
   analyzer's own next-line marker, in the form
   `<marker> <rule> -- false positive, case FP-nnnn: <one-line reason>`
   (for Biome, `biome-ignore <rule>: false positive, case FP-nnnn: <one-line reason>`). Any REAL verdict with a
   concrete `Fix:` is recorded `fixed`, and the builder applies that fix with
   no marker. A fix is not a suppression, so it needs no owner decision. Only
   when no REAL verdict gives a fix (`split`, or `escalated` when all three
   ruled REAL), or the fix cannot be applied, does the case go to the
   repository owner. Every outcome's
   envelope is committed under `docs/agents/adjudications/`, so the history
   keeps each verdict, and a new case takes the next number after every case
   in the working tree and on the default branch. Two branches opening a case
   at once can pick the same number. Git then refuses the second merge as an
   add/add conflict on `FP-nnnn.json`, which is the collision showing itself
   rather than a silent overwrite.
6. **The upstream draft is never posted** to the analyzer's tracker without the
   owner's explicit yes.

`vp run suppressions:verify` enforces the list. It reads every marker in the
tree that claims a false positive and fails unless all of these hold: the
marker names a case and gives a reason; one live entry has the same analyzer,
rule and file; every entry has exactly one marker; the case file exists and is
a valid adjudication envelope; the panel sat three distinct models, two judges
and one adversary, all ruling FALSE_POSITIVE; the sha256 of the lines under the
marker still matches the entry; and the entry has not expired. The same gate
fails an unadjudicated ESLint, Oxlint, Biome or React Doctor marker outside the
public packages. Inside them, the register in
`public-package-suppressions.json` still governs the markers that predate this
decision. `vp run fallow:suppressions` accepts a fallow marker in a changed
file only when a live entry of the list names its case, for the same file and
kind. The pre-commit hook, `check:push`, `check:safe` and CI run both.

**The no-comment rule gains a fourth exemption:** the one-line reason on a
false-positive marker. It is the only comment the gate requires, and it says
which case confirmed the dismissal. The rationale belongs in the case file and
the verdicts, not in that line.

### What the blindness rests on

The agent definitions tell a seat not to look for the builder's argument, but
nothing depends on a seat obeying that. Four mechanisms decide what it can
reach:

1. **The case file has no free-text input.** `vp run adjudicate` builds it
   from the analyzer's own output, the analyzer's explanation and trace, and
   the code. It refuses any option or positional that could carry prose.
2. **The tree has no history.** The sessions run in a temporary directory
   holding `git archive` of the case's `head_sha`, so there is no `.git`, no
   commit message, no branch name and no reflog to read. The coordination
   claims (`docs/coordination/tasks/`, `docs/coordination/branches/`) are
   deleted from the export. The command refuses to start if the flagged
   lines at that commit do not hash as the case recorded them, so the code
   the panel reads is the code the case names.
3. **The tools cannot leave the tree.** A seat gets Read, Glob and Grep and
   nothing else: no Bash, no network, no MCP server, and no project settings
   or hooks (`settingSources` is empty). A PreToolUse hook
   (`scripts/lib/panel-scope.mjs`) refuses any other tool, and any path or
   pattern that resolves outside the export, symlinks included. Claude Code's
   working-directory rule alone does not do this: a `dontAsk` session read a
   file outside its working directory by absolute path until the hook was in
   place.
4. **The pull request is not on disk.** Its body and comments live on GitHub,
   which no seat can reach without a network tool.

What this does not cover: the repository's own files at that commit, which a
seat should read, can still hold prose a builder wrote in an earlier commit.
The case's commit should be the finding's code, not the argument for
dismissing it.

## Consequences

- A false positive no longer blocks a commit with no way through, and the way
  through costs three model sessions plus a record in the tree.
- Any edit to the flagged lines voids the dismissal. That is the point, and it
  also means a reformat or a rename re-opens the question.
- An entry expires within six months. A dismissal that is still right has to
  be re-adjudicated then, which is a cost on purpose: the analyzer may have
  fixed its rule in the meantime.
- CI cannot prove the sessions ran. The verdicts are in the PR diff, and the
  PR's blind verifier reads them. The gate checks the record's shape, not that
  three models produced it.
- `apps/showcase` lints with `--no-inline-config`, so an ESLint marker there
  suppresses nothing. A panel can still dismiss an ESLint finding there; the
  marker just has no effect until that flag changes.
- fallow markers outside the public packages that predate this decision are
  checked only when their file changes, through `fallow:suppressions`, because
  three such markers await their own adjudication (#1569). The repository-wide
  check applies to fallow markers only once they claim a case.
- TypeScript's escape hatches and `NOSONAR` have no panel. They stay under the
  public-package register, and are not accepted elsewhere through this route.

## Alternatives considered

- **Let the builder dismiss a finding with a written reason.** Rejected: the
  public-package register already worked that way for its `permanent` entries,
  and the reviewer then judges the builder's argument rather than the finding.
  Keeping the argument out of the case file is the whole design.
- **One verifier.** Rejected: one model's blind spot passes unchecked. Two
  judges and an adversary on three different models make a shared blind spot
  less likely, and the adversary is the seat paid to find the reason the
  finding is real.
- **Majority vote.** Rejected: a split means at least one model found a reason
  the finding is real. That reason goes to a human, not to arithmetic.
- **Keep the list without a marker, or the marker without a list.** Rejected: a
  list entry with no marker suppresses nothing, and a marker with no entry has
  no evidence behind it. The gate needs both to agree, one to one.

## Amendment 2026-11-08 — an owner ruling, and a case on uncommitted lines

[#1600](https://github.com/luciocabrera/lcabrera-stack/issues/1600). Two
steps of the Decision had no way to complete, and the owner chose both
designs below over their alternatives.

**The owner's ruling is recorded in the envelope.** Step 5 sends a split, or a
`fixed` case whose fix cannot be applied, to the repository owner, but the gate
accepted only a unanimous dismissal, so a marker carrying the owner's ruling
always failed `not-unanimous`.
`vp run adjudicate:rule -- FP-nnnn --verdict <FALSE_POSITIVE|REAL> --by <login> --reference <url>`
now writes an `owner_ruling` object into `FP-nnnn.json`: the `verdict`, `by`
(a GitHub login), `at` (a `YYYY-MM-DD` date, today unless `--at` names one)
and `reference` (the `https` URL of the comment where the owner ruled). The
envelope schema holds that shape, and the emitted `adjudication.schema.json`
keeps the `https` rule as a pattern. It also refuses a ruling on a `dismissed` or
`escalated` case, and one dated before the case opened. A FALSE_POSITIVE
ruling writes the list entry and prints the marker, as a unanimous dismissal
does. A REAL one writes only the ruling, and the builder fixes the finding. The
command never overwrites a ruling.

A ruled case's entry expires six months after the ruling's `at`, not after the
case opened, and the gate's six-month limit is counted from the same date. A
ruling can come long after the panel sat. Counted from the opening day, a late
ruling would print a marker for an entry the gate already rejects as expired.
The command refuses an `at` far enough back that its entry has already
expired. The six-month rule still holds: the dismissal is re-adjudicated six
months after the last decision that made it.

Nothing checks that `by` names the repository owner, or that `reference` holds
their ruling. The PR diff carries the ruling, and its review is the check.

`suppressions:verify` accepts a split or `fixed` envelope only when its
`owner_ruling` is complete and says FALSE_POSITIVE. A missing, empty or
malformed field fails the envelope as invalid, and a REAL ruling fails as
`owner-ruled-real`. The panel still needs three distinct models, two judges and
one adversary, whatever the owner ruled. With no ruling the gate behaves as
before, and a split fails `not-unanimous`. The rejection of a majority vote
stands: what settles a split is the owner's named ruling, never a count of the
verdicts.

The alternatives were to keep the gate unanimous-only, which leaves the owner's
decision with nowhere to go, or to re-run the panel until it agrees, which
replaces the decision with another vote.

**A case can name a snapshot of the working tree.** Step 3 runs the panel in a
`git archive` export of the case's commit, and the export refused flagged lines
that commit did not hold. The pre-commit hook runs Biome, ESLint and Oxlint and
refuses a line they flag, so a finding from any of the three could not reach the
panel without bypassing the hook. `vp run adjudicate` now checks whether HEAD
holds the flagged lines. When it does not, the case's `head_sha` is the commit
`git stash create` prints. That command writes a commit object holding the
staged and unstaged changes to tracked files, runs no hook, moves no ref and
adds no stash entry. The command refuses when there is nothing to snapshot, and
when the snapshot does not hold the lines either. A snapshot leaves out
untracked files, so a flagged line in a new file reaches it once the file is
staged, and staging runs no hook. The `base_sha` stays the merge base, and the
line hash is taken from the working tree. That is the same hash the gate takes
under the marker once the marker is committed above those lines.

Nothing references the snapshot commit, so `git gc` may prune it once it is
older than `gc.pruneExpire`. Run the panel before then. A pruned snapshot fails
the export with the sha it could not archive.

The alternatives were to export the working tree with no commit at all, which
leaves the case naming no tree anyone can re-read, or to restructure the code
until the analyzer stops reporting it, which is the bending of correct code
this decision exists to stop.

## References

- [#1549](https://github.com/luciocabrera/lcabrera-stack/issues/1549) — the
  epic and the owner's policy for suppressions.
- [#1553](https://github.com/luciocabrera/lcabrera-stack/issues/1553) — the
  adjudication envelope this gate validates.
- [#1572](https://github.com/luciocabrera/lcabrera-stack/pull/1572) — the
  `fallow:suppressions` gate this decision relaxes for a confirmed case.
- [#1555](https://github.com/luciocabrera/lcabrera-stack/issues/1555) — the
  skill that drives the panel through the Agent tool.
