# Handoff Prompts

Generated at: 2026-06-12T11:15:00.085Z

## Planner Agent Prompt

Read reports/skills/code-smell-compliance-report.md and reports/skills/fix-plan.md.
Refine the plan with exact file paths, risk level, and effort for each item.
Append a progress entry to reports/skills/agenting-plan-progress.md.

## Fixer Agent Prompt

Execute only Item 1 from reports/skills/fix-plan.md.
After changes, run validation commands listed in the plan.
Append PASS or FAIL entry to reports/skills/agenting-plan-progress.md and stop.

## Verifier Agent Prompt

Review the fixer changes against reports/skills/fix-plan.md and the latest report.
Confirm whether item scope, validations, and status updates were done correctly.
Append verification outcome to reports/skills/agenting-plan-progress.md.
