# Smell Findings Report

## Metadata

- schema_version: 1.0
- report_id: <report-id>
- generated_at: <YYYY-MM-DDTHH:MM:SSZ>
- skill_name: <code-smell-checker|code-smell-zen>
- repository: <repo-name-or-path>
- scope_type: <repo|folder|changed-files|diff>
- scope_value: <scope value>
- severity_scale: BLOCKER, HIGH, MEDIUM, LOW, NIT
- base_branch: <optional>
- head_branch: <optional>
- commit_range: <optional>
- classification: <feature|refactor|bugfix|test|docs|config|mixed>
- primary_lens: <Clean Code|Gang of Four|Mixed>

## Summary

- files_analyzed: <number>
- findings_count_by_severity:
  - blocker: <number>
  - high: <number>
  - medium: <number>
  - low: <number>
  - nit: <number>
- top_risk: <one sentence>
- first_3_actions:
  1. <action>
  2. <action>
  3. <action>

## Findings

### Finding <F-001>

- finding_id: <F-001>
- rule_id: <CC.G5|GOF.STRATEGY-MISSING|TS.ANY-LEAK|REACT.MISSING-DEPS|CHK.\*>
- severity: <BLOCKER|HIGH|MEDIUM|LOW|NIT>
- confidence: <high|medium|low>
- location_path: <project-relative-path>
- location_hint: <line or range or region>
- evidence_excerpt:

```text
<minimal meaningful excerpt>
```

- why: <one sentence>
- fix: <one sentence>
- effort: <small|medium|large>
- defer_risk: <one sentence>
- verification_steps:
  - <step 1>
  - <step 2>
- status: <open|in-progress|done|deferred>
- owner: <optional>
- dependencies: <optional>
- related_findings: <optional>
- tags: <optional>

### Finding <F-002>

- finding_id: <F-002>
- rule_id: <...>
- severity: <...>
- confidence: <...>
- location_path: <...>
- location_hint: <...>
- evidence_excerpt:

```text
<...>
```

- why: <...>
- fix: <...>
- effort: <...>
- defer_risk: <...>
- verification_steps:
  - <...>
- status: <...>

## Prioritized Execution Queue

1. queue_rank: 1

- target_finding_ids: <F-001, F-003>
- reason_for_order: <one sentence>
- expected_outcome: <one sentence>

2. queue_rank: 2

- target_finding_ids: <F-002>
- reason_for_order: <one sentence>
- expected_outcome: <one sentence>

3. queue_rank: 3

- target_finding_ids: <F-004>
- reason_for_order: <one sentence>
- expected_outcome: <one sentence>

## Deferred Items

- finding_id: <F-010>
- deferral_reason: <why deferred>
- revisit_trigger: <condition/date>

## Validation Checklist

- [ ] Required sections present
- [ ] Required metadata fields present
- [ ] Summary counts match findings
- [ ] Each finding has evidence_excerpt, why, fix
- [ ] Each finding has verification_steps
- [ ] Severity values are canonical
- [ ] Prioritized queue present when findings exist

## Closure Criteria

- <objective condition 1>
- <objective condition 2>
- <objective condition 3>
