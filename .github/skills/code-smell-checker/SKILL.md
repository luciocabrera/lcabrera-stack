---
name: code-smell-checker
description: Systematically detect and triage code smells across a codebase. Use for maintainability audits, refactor planning, PR hygiene checks, and tech debt reviews. Includes severity scoring, false-positive filtering, and fix-priority decisions.
argument-hint: 'Target area or language, for example: src/, TypeScript services, or React frontend app'
user-invocable: true
allowed-tools: Bash(cat:*,date:*,git:*,mkdir:*,node:*,tee:*), Read, Grep, Glob
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

- assign severity using the canonical scale: BLOCKER, HIGH, MEDIUM, LOW, NIT
- estimate fix effort: small, medium, large
- map each finding to a suggested remediation pattern
- assign a stable heuristic ID where no catalog ID exists, using the format `CHK.<DOMAIN>.<LABEL>` (e.g. `CHK.ARCH.CYCLE`, `CHK.FUNC.LONG`)

7. Build the action plan.

- order fixes by risk reduction first, then implementation cost
- identify safe quick wins and risky refactors requiring tests/guards

8. Define done criteria.

- no unresolved BLOCKER findings in scoped area
- HIGH-severity findings either fixed or tracked with owner and rationale
- relevant tests/lint/type checks pass after changes

## Decision Logic

Use this branching logic while triaging:

- If a smell has direct correctness, security, data-loss, or crash risk: classify as BLOCKER and prioritize immediately.
- If a smell amplifies change cost across many modules or clearly degrades behavior: classify HIGH even without current bugs.
- If a smell is a design weakness worth fixing soon: classify MEDIUM.
- If a smell is minor with low maintenance impact: classify LOW and defer.
- If a smell is a style preference with no real cost: classify NIT.
- If evidence is weak or tool signal is noisy: mark as potential false positive and request focused validation.

## Report Format

Produce the final report using the shared output contract exactly as defined in:

- `../code-smell-shared/REPORT_TEMPLATE.md` — section order and field structure
- `../code-smell-shared/SCHEMA_V1.md` — canonical severity scale and validation rules
- `../code-smell-shared/TEST_PLAN.md` — verification step patterns
- `../code-smell-shared/RULE_FIX_QUICK_REFERENCE.md` — remediation patterns

### Canonical Severity Scale

Use these severity labels verbatim in the final report:

- **BLOCKER** — security, correctness, data-loss, or runtime-crash risk
- **HIGH** — clearly wrong; will regress maintainability or behavior
- **MEDIUM** — design weakness worth fixing now
- **LOW** — minor; fix in passing
- **NIT** — style preference, no real cost

### Required Sections (in order)

1. Metadata (schema_version, report_id, generated_at, skill_name, repository, scope_type, scope_value, severity_scale)
2. Summary (files_analyzed, findings_count_by_severity, top_risk, first_3_actions)
3. Findings (one entry per finding, all fields from SCHEMA_V1 §5)
4. Prioritized Execution Queue (at least 3 items when findings > 0)
5. Deferred Items (or explicit "None")
6. Validation Checklist
7. Closure Criteria

For each finding, include: finding_id, rule_id (catalog ID or `CHK.<DOMAIN>.<LABEL>` heuristic), severity, confidence, location_path, location_hint, evidence_excerpt, why, fix, effort, defer_risk, verification_steps, status.

## Saving the Report

After producing the final report, **always** save it to disk without prompting the user:

1. Determine the output directory. Check whether the `OUTPUT_DIR` environment variable is already set (`echo "$OUTPUT_DIR"`) — a UI-triggered scan sets this so its scratch files land in the right place, not the target project's own working tree. If it's set, use it as-is. Otherwise, capture the current timestamp (`date +%Y-%m-%d--%H-%M-%S`) and use `.tmp/code-smell-checker/{timestamp}/`.
2. Create the output directory (`mkdir -p`) if it doesn't already exist.
3. Write the full report as `report.md` inside that directory, following the shared `REPORT_TEMPLATE.md` structure exactly.
4. Build `report.json` from the same findings, following `../code-smell-shared/REPORT_JSON_CONTRACT.md` exactly (flatten severity counts, map any non-canonical `status` — e.g. `resolved` — to `done`; every finding is `single_location`, this skill never emits `duplication_group`), and write it as `report.json` in the same directory.
5. Tell the user the paths to both saved files.
6. Ingest into CQMS (best-effort — do not fail the skill run if this step fails; both files are already saved regardless). Run, substituting `$OUTPUT_DIR` with the resolved directory from step 1:

```bash
node --env-file-if-exists=docker/local/.env --env-file-if-exists=packages/scan-ingestion/.env --experimental-strip-types packages/scan-ingestion/src/cli/ingest.cli.ts --skill=code-smell-checker --run-dir="$OUTPUT_DIR" --local-path="$(git rev-parse --show-toplevel)"
```

If it fails (e.g. `cqms_db` unreachable), tell the user the ingestion failed and why, but do not treat it as a skill failure.

The directory layout groups all runs of this skill together, with each run in its own timestamped subfolder:

```
.tmp/
└── code-smell-checker/
    ├── 2026-06-12--18-40-56/
    │   ├── report.md
    │   └── report.json
    └── 2026-06-15--09-30-12/
        ├── report.md
        └── report.json
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
- `report.md` and `report.json` both saved to the same run directory
- ingestion into CQMS attempted (best-effort; failures reported but non-fatal)

## Example Prompts

- /code-smell-checker audit the full repository and prioritize only high and critical smells
- /code-smell-checker check backend services for maintainability smells and propose a 2-day fix plan
- /code-smell-checker analyze changed files in this branch and flag likely refactor hotspots
