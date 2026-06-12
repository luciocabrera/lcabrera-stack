# Code Smell Skills Test Plan

This plan validates both skills against the same quality bar and output schema.

## 1. Test Objectives

- Verify structural compliance with schema v1.0
- Verify finding quality (evidence, rationale, fix actionability)
- Verify prioritization quality and consistency
- Measure false-positive rate and missing critical findings

## 2. Test Layers

### Layer A: Contract tests

Goal: Confirm report shape and required fields.

Method:

1. Run each skill on controlled input.
2. Check required sections and required finding fields.
3. Fail on any missing required field.

Pass criteria:

- 100 percent schema compliance.

### Layer B: Fixture quality tests

Goal: Measure precision and recall against expected findings.

Method:

1. Prepare fixture set with known smells and expected outcomes.
2. Run both skills on fixture-compatible scopes.
3. Compare actual findings with expected findings.

Metrics:

- Precision = correct findings / total findings
- Recall = correct findings / expected findings
- Critical capture rate = expected blocker findings detected / expected blocker findings

Pass criteria recommendation:

- Precision >= 0.70
- Recall >= 0.70
- Critical capture rate >= 0.90

### Layer C: Live repo smoke tests

Goal: Validate practical usefulness in real PR workflows.

Method:

1. Select 5 recent PRs or diffs.
2. Run both skills.
3. Evaluate reviewer agreement and actionability.

Metrics:

- Reviewer acceptance rate
- Median time to first accepted fix
- False-positive complaints
- High-severity unresolved after merge

## 3. Fixture Design Guidelines

Include at minimum:

- Clean diff with no findings
- Duplication-heavy diff
- Unsafe TypeScript narrowing and any-leak anti-patterns
- React hook dependency and list key anti-patterns
- Large conditional chain suggesting Strategy/State
- Mixed docs/config/code changes
- One intentionally noisy fixture to test false-positive filtering

## 4. Scoring Rubric

Score each run on 0-2 scale per criterion:

- Structure compliance
- Evidence quality
- Fix quality
- Severity calibration
- Prioritization quality

Total score range: 0-10.
Recommended release threshold: 8 or higher.

## 5. Regression Policy

Re-run full fixture suite when:

- Skill prompt changes
- Catalog IDs are updated
- Severity logic changes
- Report schema changes

Track deltas per run:

- Precision
- Recall
- Critical capture rate
- Structure compliance

## 6. Minimal Execution Checklist

- [ ] Run both skills on same fixture batch
- [ ] Validate schema v1.0 compliance
- [ ] Compare against expected findings
- [ ] Compute precision/recall/critical capture
- [ ] Record top false positives
- [ ] Record missed critical findings
- [ ] Produce remediation recommendations for prompt tuning
