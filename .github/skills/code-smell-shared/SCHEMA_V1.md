# Code Smell Report Schema v1.0

This document defines a canonical output contract for both skills:

- code-smell-checker
- code-smell-zen

The objective is to keep findings actionable and structurally identical for downstream agent handoff.

## 1. Canonical Severity Scale

Use this canonical scale in the final report:

- BLOCKER
- HIGH
- MEDIUM
- LOW
- NIT

If a skill uses a different native label, map it before final output.

### Severity mapping

| Native source | Canonical output |
| ------------- | ---------------- |
| critical      | BLOCKER          |
| high          | HIGH             |
| medium        | MEDIUM           |
| low           | LOW              |
| nit           | NIT              |

## 2. Required Report Sections

A valid report must include all sections below in this order:

1. Metadata
2. Summary
3. Findings
4. Prioritized Execution Queue
5. Deferred Items
6. Validation Checklist
7. Closure Criteria

If there are zero findings, keep all sections and explicitly state no findings.

## 3. Metadata Contract

Required fields:

- schema_version: must be 1.0
- report_id: non-empty string
- generated_at: ISO-8601 datetime
- skill_name: code-smell-checker or code-smell-zen
- repository: repository name/path
- scope_type: repo | folder | changed-files | diff
- scope_value: non-empty string
- severity_scale: must list BLOCKER, HIGH, MEDIUM, LOW, NIT

Optional fields:

- base_branch
- head_branch
- commit_range
- classification: feature | refactor | bugfix | test | docs | config | mixed
- primary_lens: Clean Code | Gang of Four | Mixed

## 4. Summary Contract

Required fields:

- files_analyzed: integer >= 0
- findings_count_by_severity: counts for blocker/high/medium/low/nit
- top_risk: one sentence
- first_3_actions: exactly 3 bullet items when findings > 0, otherwise one line: No actions required.

## 5. Finding Contract

Each finding must include:

- finding_id: unique within the report
- rule_id: catalog ID or heuristic ID
- severity: BLOCKER | HIGH | MEDIUM | LOW | NIT
- confidence: high | medium | low
- location_path: project-relative path
- location_hint: line number, range, or region label
- evidence_excerpt: minimal meaningful excerpt
- why: one sentence
- fix: one sentence
- effort: small | medium | large
- defer_risk: one sentence
- verification_steps: bullet list with at least 1 verification step
- status: open | in-progress | done | deferred

Optional finding fields:

- owner
- dependencies
- related_findings
- tags

## 6. Prioritized Queue Contract

When findings > 0, include at least 3 queue items. Each item must include:

- queue_rank: integer starting at 1
- target_finding_ids: one or more finding IDs
- reason_for_order: one sentence
- expected_outcome: one sentence

## 7. Deferred Items Contract

If any finding has status=deferred, include:

- finding_id
- deferral_reason
- revisit_trigger

If none are deferred, include: None.

## 8. Pass/Fail Validation Rules

A report fails validation when any condition below is true:

- Missing required section
- Missing required field in metadata, summary, or any finding
- Any severity outside canonical scale
- Duplicate finding_id
- Summary counts do not match findings
- Findings > 0 but no prioritized queue
- Finding missing evidence_excerpt, why, or fix
- Finding missing verification_steps

A report passes when all required fields are present and all checks succeed.

## 9. Skill Mapping Notes

- code-smell-checker may emit heuristic categories where no catalog ID exists. Use a stable heuristic ID format, for example: CHK.ARCH.CYCLE or CHK.FUNC.LONG.
- code-smell-zen should preserve catalog IDs exactly as defined in its catalog.
- Both skills must output the same section order and finding fields for handoff consistency.
