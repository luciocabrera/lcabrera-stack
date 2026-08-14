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
      **[auto: PR Standards / `pr:verify`** for `## What` and `## Verification`;
      **judgement** for the rest]
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
- [ ] **Reviewed by a supervising agent or human** **[judgement]**
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

A green PR means those ran — it does not mean the **[judgement]** items were
considered. That is the gap this checklist covers.
