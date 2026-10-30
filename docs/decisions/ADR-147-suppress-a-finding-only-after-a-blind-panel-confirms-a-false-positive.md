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
   `fp-adversary` once (`.claude/agents/`). At least one model differs from the
   builder's, and the three are distinct. The sessions are read-only, and the
   command voids the panel if the working tree changed while they ran.
4. **Read the verdicts.** Each verdict file starts with `REAL` or
   `FALSE_POSITIVE` on line one. A REAL carries a `Fix:`. A FALSE_POSITIVE
   carries a `Check:` that could have shown the finding real (Rule 14).
5. **Decide.** Three FALSE_POSITIVE: the case is dismissed. The command writes
   the envelope to `docs/agents/adjudications/FP-nnnn.json`, an upstream draft
   beside the case, and an entry in `docs/agents/false-positives.json` that
   expires at most six months after the case opened. The builder adds the
   analyzer's own next-line marker, in the form
   `<marker> <rule> -- false positive, case FP-nnnn: <one-line reason>`
   (`<marker> <rule>: false positive, …` for Biome). All REAL: fix it, no
   marker. A split: stop and ask the repository owner.
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

## References

- [#1549](https://github.com/luciocabrera/lcabrera-stack/issues/1549) — the
  epic and the owner's policy for suppressions.
- [#1553](https://github.com/luciocabrera/lcabrera-stack/issues/1553) — the
  adjudication envelope this gate validates.
- [#1572](https://github.com/luciocabrera/lcabrera-stack/pull/1572) — the
  `fallow:suppressions` gate this decision relaxes for a confirmed case.
- [#1555](https://github.com/luciocabrera/lcabrera-stack/issues/1555) — the
  skill that drives the panel through the Agent tool.
