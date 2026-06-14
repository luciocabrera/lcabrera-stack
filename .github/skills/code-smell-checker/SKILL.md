---
name: code-smell-checker
description: 'Systematically detect and triage code smells across a codebase. Use for maintainability audits, refactor planning, PR hygiene checks, and tech debt reviews. Includes severity scoring, false-positive filtering, and fix-priority decisions.'
argument-hint: 'Target area or language, for example: src/, TypeScript services, or React frontend app'
user-invocable: true
allowed-tools: Bash(cat:_,date:_,mkdir:_,tee:_), Read, Grep, Glob
license: MIT
---

# Code Smell Checker

## Outcome

Produce a prioritized, evidence-based code smell report that:

- identifies concrete smells with file-level evidence
- separates critical maintainability risks from minor style issues
- recommends actionable fixes with order of execution
- defines completion criteria and follow-up checks

## When to Apply

Use this skill when you need to:

- assess overall code health before feature work
- prepare a refactor backlog
- review a pull request for maintainability risk
- identify recurring patterns that increase bug risk

## Inputs

Collect or infer:

- scope: full repository, specific folders, or changed files
- language stack: TypeScript, React, mixed, etc.
- context: baseline audit, PR review, or pre-release hardening
- constraints: time budget, no-behavior-change requirement, test coverage expectations

If inputs are missing, default to:

- scope: most active source directories
- context: baseline maintainability audit
- output format: prioritized findings list with quick wins first

## Procedure

1. Define audit boundaries.

- map code areas included and excluded
- identify generated code, vendored code, and migrations to exclude

2. Run fast static discovery.

- collect lint, type-check, and test signals where available
- scan for high-signal smell markers (long files, deep nesting, duplicated logic, magic values, broad catch blocks, large parameter lists)

3. Inspect architecture-level smells.

- check for cycles, god modules, leaky abstractions, mixed concerns (I/O + business logic + formatting), and unstable dependencies

4. Inspect function- and class-level smells.

- detect long methods, complex conditionals, excessive branching, feature envy, data clumps, primitive obsession, and shotgun surgery indicators

5. Inspect maintainability hygiene.

- verify naming consistency, dead code, commented-out code, inconsistent error handling, and weak testability seams

6. Score and triage findings.

- assign severity: critical, high, medium, low
- estimate fix effort: small, medium, large
- map each finding to a suggested remediation pattern

7. Build the action plan.

- order fixes by risk reduction first, then implementation cost
- identify safe quick wins and risky refactors requiring tests/guards

8. Define done criteria.

- no unresolved critical findings in scoped area
- high-severity findings either fixed or tracked with owner and rationale
- relevant tests/lint/type checks pass after changes

## Decision Logic

Use this branching logic while triaging:

- If a smell has direct correctness or security risk: classify as critical and prioritize immediately.
- If a smell amplifies change cost across many modules: classify high even without current bugs.
- If a smell is stylistic with low maintenance impact: classify low and defer.
- If evidence is weak or tool signal is noisy: mark as potential false positive and request focused validation.

## Report Format

For each finding, include:

- smell type
- severity
- evidence (path and short snippet summary)
- impact if ignored
- recommended fix pattern
- estimated effort
- prerequisites (tests, migration path, feature flag, etc.)

Then provide:

- top 3 quick wins
- top 3 high-leverage refactors
- deferred items with rationale

Use the shared output contract and template:

- `../code-smell-shared/SCHEMA_V1.md`
- `../code-smell-shared/REPORT_TEMPLATE.md`
- `../code-smell-shared/TEST_PLAN.md`
- `../code-smell-shared/RULE_FIX_QUICK_REFERENCE.md`

When severity is `critical`, normalize it to `BLOCKER` in the final report to keep cross-skill outputs consistent.

## Saving the Report

After producing the final report, **always** save it to disk without prompting the user:

1. Capture the current timestamp: `date +%Y%m%dT%H%M%S`
2. Create the output directory: `.tmp/code-smell-checker/<timestamp>/`
3. Write the full report as `report.md` inside that directory, following the shared `REPORT_TEMPLATE.md` structure exactly.
4. Tell the user the path to the saved file.

The directory layout groups all runs of this skill together, with each run in its own timestamped subfolder:

```
.tmp/
└── code-smell-checker/
    ├── 20260612T184056/
    │   └── report.md
    └── 20260615T093012/
        └── report.md
```

## Quality Checks

Before finalizing the report:

- verify each finding has concrete code evidence
- remove duplicates and merge related findings
- distinguish root cause from downstream symptoms
- ensure recommendations are behavior-safe unless explicitly allowed otherwise
- confirm prioritization is consistent with impact and effort

## Completion Checklist

- scope and exclusions documented
- findings ranked by severity and effort
- remediation plan proposed in execution order
- validation steps defined (lint/type/tests/monitoring where applicable)
- residual risk documented

## Example Prompts

- /code-smell-checker audit the full repository and prioritize only high and critical smells
- /code-smell-checker check backend services for maintainability smells and propose a 2-day fix plan
- /code-smell-checker analyze changed files in this branch and flag likely refactor hotspots
