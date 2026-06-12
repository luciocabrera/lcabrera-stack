# Handoff Runbook

Generated at: 2026-06-12T11:15:00.085Z

## Goal

Run a repeatable planner -> fixer -> verifier workflow without remembering prompts.

## Files Used

- findings input: reports/skills/code-smell-checker-actual-repo.md
- fallback findings: reports/skills/code-smell-full-audit.md
- planner output: reports/skills/fix-plan.md
- progress log: reports/skills/agenting-plan-progress.md

## Step 1: Planner Chat

Copy/paste this prompt:

```text
Read reports/skills/code-smell-checker-actual-repo.md and reports/skills/fix-plan.md.
If reports/skills/code-smell-checker-actual-repo.md is missing, use reports/skills/code-smell-full-audit.md.
Refine fix-plan.md with strict priority order, exact files/symbols, risk, effort, and validation commands per item.
Keep one-item-at-a-time execution rules.
Append PLAN-READY entry to reports/skills/agenting-plan-progress.md.
```

Checklist:

- [ ] fix-plan.md updated
- [ ] PLAN-READY appended

## Step 2: Fixer Chat

Copy/paste this prompt:

```text
Read reports/skills/fix-plan.md.
Execute only Item 1.
Run all validation commands required by that item.
Append to reports/skills/agenting-plan-progress.md: item id, changed files, validation output summary, and PASS/FAIL.
Stop after Item 1 and wait.
```

Checklist:

- [ ] item 1 implemented
- [ ] validations run
- [ ] PASS/FAIL appended

## Step 3: Verifier Chat

Copy/paste this prompt:

```text
Review the Item 1 changes against reports/skills/fix-plan.md and the findings report.
Confirm scope correctness and validation quality.
Append VERIFIED-PASS or VERIFIED-FAIL to reports/skills/agenting-plan-progress.md.
```

Checklist:

- [ ] verification complete
- [ ] VERIFIED status appended

## Step 4: Repeat

- Move to Item 2 and repeat Steps 2-3.
- Re-run planner only when priorities need to change.

## Quick Command

Refresh handoff artifacts anytime:

```bash
vp run skills:handoff
```
