# Handoff Runbook (Source Audit)

Generated at: 2026-06-12T11:15:00.085Z

## Goal

Drive remediation from full app-code smell findings in a repeatable planner -> fixer -> verifier loop.

## Files Used

- findings input: reports/skills/code-smell-full-audit.md
- optional curated findings: reports/skills/code-smell-checker-actual-repo.md
- planner output: reports/skills/fix-plan.md
- progress log: reports/skills/agenting-plan-progress.md

## Step 0: Refresh Findings

Run:

```bash
vp run skills:source-audit
```

This single command refreshes the full source audit report and regenerates handoff artifacts (fix plan, prompts, runbooks).
Confirm reports/skills/code-smell-full-audit.md exists and is recent.

## Step 1: Planner Chat

Copy/paste this prompt:

```text
Read reports/skills/code-smell-full-audit.md and reports/skills/fix-plan.md.
Refine fix-plan.md into an executable queue using the highest severity items first.
For each item, include exact file paths, symbols, risk, effort, and validation commands.
Keep one-item-at-a-time execution and rollback-safe steps.
Append PLAN-READY-SOURCE-AUDIT to reports/skills/agenting-plan-progress.md.
```

Checklist:

- [ ] fix-plan.md prioritized from source audit
- [ ] PLAN-READY-SOURCE-AUDIT appended

## Step 2: Fixer Chat

Copy/paste this prompt:

```text
Read reports/skills/fix-plan.md.
Execute only Item 1 from the source-audit queue.
Run all required validation commands for that item.
Append SOURCE-ITEM-1 PASS/FAIL with changed files and validation summary to reports/skills/agenting-plan-progress.md.
Stop and wait.
```

Checklist:

- [ ] item 1 fixed
- [ ] validations run
- [ ] SOURCE-ITEM-1 status appended

## Step 3: Verifier Chat

Copy/paste this prompt:

```text
Review Item 1 changes against reports/skills/fix-plan.md and reports/skills/code-smell-full-audit.md.
Confirm scope, risk mitigation, and validation quality.
Append SOURCE-ITEM-1 VERIFIED-PASS or VERIFIED-FAIL to reports/skills/agenting-plan-progress.md.
```

Checklist:

- [ ] source item verified
- [ ] VERIFIED status appended

## Step 4: Iterate

- Repeat Steps 2-3 for next item.
- Re-run planner when priorities or dependencies change.

## Quick Commands

```bash
vp run skills:source-audit
```
