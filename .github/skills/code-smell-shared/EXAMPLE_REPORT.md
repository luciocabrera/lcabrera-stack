# Smell Findings Report

## Metadata

- schema_version: 1.0
- report_id: demo-2026-06-12-001
- generated_at: 2026-06-12T10:30:00Z
- skill_name: code-smell-zen
- repository: ai
- scope_type: diff
- scope_value: origin/main...HEAD + working tree
- severity_scale: BLOCKER, HIGH, MEDIUM, LOW, NIT
- base_branch: origin/main
- head_branch: HEAD
- commit_range: origin/main...HEAD
- classification: refactor
- primary_lens: Mixed

## Summary

- files_analyzed: 4
- findings_count_by_severity:
  - blocker: 1
  - high: 1
  - medium: 1
  - low: 0
  - nit: 1
- top_risk: Missing hook dependencies can produce stale side effects and inconsistent user-visible behavior.
- first_3_actions:
  1. Add complete hook dependencies to eliminate stale side-effect closures.
  2. Extract branching behavior into strategy objects to reduce repeated type-based conditionals.
  3. Replace unsafe type assertions with runtime validation and typed narrowing.

## Findings

### Finding F-001

- finding_id: F-001
- rule_id: REACT.MISSING-DEPS
- severity: BLOCKER
- confidence: high
- location_path: src/features/orders/OrdersList.tsx
- location_hint: 34-53
- evidence_excerpt:

```tsx
useEffect(() => {
  trackFilterUsage(filters);
}, []);
```

- why: Omitting dependencies from the effect can freeze data updates and show stale results as filters change.
- fix: Include all referenced values in dependencies and keep effect logic side-effect scoped.
- effort: small
- defer_risk: Users may act on outdated data, causing correctness issues and support incidents.
- verification_steps:
  - Add a test that changing filters triggers tracking with the current filter value.
  - Validate no stale closure behavior in the list refresh flow.
- status: open
- tags: security, correctness

### Finding F-002

- finding_id: F-002
- rule_id: GOF.STRATEGY-MISSING
- severity: HIGH
- confidence: medium
- location_path: src/domain/pricing/calculatePrice.ts
- location_hint: 42-97
- evidence_excerpt:

```ts
if (customerType === 'new') {
    ...
} else if (customerType === 'vip') {
    ...
} else if (customerType === 'corporate') {
    ...
}
```

- why: Repeated type-based branching increases change risk and violates open/closed behavior.
- fix: Introduce a strategy map keyed by customer type with one implementation per strategy.
- effort: medium
- defer_risk: New customer types will require repetitive edits across multiple code paths.
- verification_steps:
  - Add parameterized tests per strategy.
  - Add a fallback test for unsupported customer types.
- status: open

### Finding F-003

- finding_id: F-003
- rule_id: TS.UNSAFE-CAST
- severity: MEDIUM
- confidence: high
- location_path: src/api/orders/transformOrder.ts
- location_hint: 18-41
- evidence_excerpt:

```ts
const order = raw as Order;
return {
  id: order.id,
  total: order.total,
};
```

- why: Unchecked assertions can accept invalid runtime shapes and push undefined values into core flows.
- fix: Validate unknown inputs with a type guard or schema parser before narrowing.
- effort: small
- defer_risk: Invalid payloads can pass compile-time checks and fail at runtime in production paths.
- verification_steps:
  - Add parser tests for malformed API payloads.
  - Ensure transform rejects invalid shape before casting.
- status: open

### Finding F-004

- finding_id: F-004
- rule_id: REACT.KEY-INDEX
- severity: NIT
- confidence: medium
- location_path: src/features/orders/OrderRows.tsx
- location_hint: 27
- evidence_excerpt:

```tsx
{
  rows.map((row, index) => <OrderRow key={index} row={row} />);
}
```

- why: Index keys cause unstable identity when list order changes and can trigger incorrect row state reuse.
- fix: Use a stable domain key such as row.id.
- effort: small
- defer_risk: Low immediate risk but persistent readability debt.
- verification_steps:
  - Verify row-local state remains attached to the correct row after reorder.
- status: deferred

## Prioritized Execution Queue

1. queue_rank: 1

- target_finding_ids: F-001
- reason_for_order: Stale data risk directly impacts correctness of the rendered UI.
- expected_outcome: List refresh reflects current filters consistently across interactions.

2. queue_rank: 2

- target_finding_ids: F-002
- reason_for_order: High leverage design fix that reduces future branching complexity.
- expected_outcome: New customer types are added without editing existing condition chains.

3. queue_rank: 3

- target_finding_ids: F-003
- reason_for_order: Medium-risk typing gap is quick to harden with parser-based validation.
- expected_outcome: Invalid payloads are rejected deterministically before business logic executes.

## Deferred Items

- finding_id: F-004
- deferral_reason: Naming cleanup is lower impact than correctness and structural refactors.
- revisit_trigger: Address during next readability-focused maintenance PR.

## Validation Checklist

- [x] Required sections present
- [x] Required metadata fields present
- [x] Summary counts match findings
- [x] Each finding has evidence_excerpt, why, fix
- [x] Each finding has verification_steps
- [x] Severity values are canonical
- [x] Prioritized queue present when findings exist

## Closure Criteria

- All BLOCKER and HIGH findings resolved.
- MEDIUM findings either resolved or formally deferred with owner and trigger.
- Verification steps executed with passing checks and no regression in touched areas.
