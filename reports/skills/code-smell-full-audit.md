# Smell Findings Report

## Metadata

- schema_version: 1.0
- report_id: source-smells-2026-06-12
- generated_at: 2026-06-12T11:14:59.884Z
- skill_name: code-smell-checker
- repository: vite-react-compiler
- scope_type: folder
- scope_value: apps/\*\*/{src,utils}
- severity_scale: BLOCKER, HIGH, MEDIUM, LOW, NIT
- classification: mixed
- primary_lens: Mixed

## Summary

- files_analyzed: 1190
- findings_count_by_severity:
- blocker: 0
- high: 2
- medium: 55
- low: 0
- nit: 0
- top_risk: Detected 2 HIGH and 55 MEDIUM findings across app source code.
- first_3_actions:
  1. Fix HIGH severity findings first and re-run the audit.
  2. Address unsafe TypeScript patterns (`any`, `@ts-ignore`, double assertions).
  3. Refactor large multi-responsibility modules into smaller units.

## Findings

### Finding F-001

- finding_id: F-001
- rule_id: CHK.FILE.LONG
- severity: HIGH
- confidence: high
- location_path: apps/react-router/src/App.tsx
- location_hint: file-length:688
- evidence_excerpt:

```text
apps/react-router/src/App.tsx has 688 lines.
```

- why: Very large source files usually combine multiple responsibilities and are harder to maintain.
- fix: Split this module into focused submodules by concern and keep behavior equivalent.
- effort: medium
- defer_risk: Large files increase regression risk during edits and reviews.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-002

- finding_id: F-002
- rule_id: REACT.EFFECT-FETCH-WITHOUT-CANCEL
- severity: HIGH
- confidence: medium
- location_path: apps/react-router/src/root/Root.component.tsx
- location_hint: module-pattern
- evidence_excerpt:

```text
Detected both useEffect(...) and fetch/axios patterns in same module.
```

- why: Fetching in effects is a known source of lifecycle and cancellation bugs in React apps.
- fix: Move data fetching to React Router loaders/actions or add robust abort/cancellation handling.
- effort: medium
- defer_risk: Effect-based fetching can cause race conditions and stale updates when not carefully canceled.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-003

- finding_id: F-003
- rule_id: TS.ANY-LEAK
- severity: MEDIUM
- confidence: medium
- location_path: apps/react-router/src/App.tsx
- location_hint: line:322
- evidence_excerpt:

```text
Card content goes here. You can add any content you want.
```

- why: The any type weakens static guarantees and can hide invalid assumptions.
- fix: Replace any with unknown plus type guards or a concrete type.
- effort: small
- defer_risk: Any leaks can propagate unsafe values across module boundaries.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-004

- finding_id: F-004
- rule_id: CHK.REACT.INLINE-STYLE
- severity: MEDIUM
- confidence: high
- location_path: apps/react-router/src/App.tsx
- location_hint: line:387
- evidence_excerpt:

```text
<div style={{ maxWidth: '20rem' }}>
```

- why: Inline styling often conflicts with centralized styling standards in large codebases.
- fix: Migrate to StyleX tokens/rules or document this as an explicit architecture exception.
- effort: small
- defer_risk: Inline styles can drift from project styling rules and reduce consistency.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-005

- finding_id: F-005
- rule_id: CHK.REACT.INLINE-STYLE
- severity: MEDIUM
- confidence: high
- location_path: apps/react-router/src/App.tsx
- location_hint: line:396
- evidence_excerpt:

```text
<p style={{ color: '#6b7280', fontSize: 13, marginTop: 8 }}>
```

- why: Inline styling often conflicts with centralized styling standards in large codebases.
- fix: Migrate to StyleX tokens/rules or document this as an explicit architecture exception.
- effort: small
- defer_risk: Inline styles can drift from project styling rules and reduce consistency.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-006

- finding_id: F-006
- rule_id: CHK.REACT.INLINE-STYLE
- severity: MEDIUM
- confidence: high
- location_path: apps/react-router/src/App.tsx
- location_hint: line:408
- evidence_excerpt:

```text
<div style={{ maxWidth: '20rem' }}>
```

- why: Inline styling often conflicts with centralized styling standards in large codebases.
- fix: Migrate to StyleX tokens/rules or document this as an explicit architecture exception.
- effort: small
- defer_risk: Inline styles can drift from project styling rules and reduce consistency.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-007

- finding_id: F-007
- rule_id: CHK.REACT.INLINE-STYLE
- severity: MEDIUM
- confidence: high
- location_path: apps/react-router/src/App.tsx
- location_hint: line:417
- evidence_excerpt:

```text
<p style={{ color: '#6b7280', fontSize: 13, marginTop: 8 }}>
```

- why: Inline styling often conflicts with centralized styling standards in large codebases.
- fix: Migrate to StyleX tokens/rules or document this as an explicit architecture exception.
- effort: small
- defer_risk: Inline styles can drift from project styling rules and reduce consistency.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-008

- finding_id: F-008
- rule_id: CHK.REACT.INLINE-STYLE
- severity: MEDIUM
- confidence: high
- location_path: apps/react-router/src/App.tsx
- location_hint: line:427
- evidence_excerpt:

```text
<div style={{ maxWidth: '20rem' }}>
```

- why: Inline styling often conflicts with centralized styling standards in large codebases.
- fix: Migrate to StyleX tokens/rules or document this as an explicit architecture exception.
- effort: small
- defer_risk: Inline styles can drift from project styling rules and reduce consistency.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-009

- finding_id: F-009
- rule_id: CHK.REACT.INLINE-STYLE
- severity: MEDIUM
- confidence: high
- location_path: apps/react-router/src/App.tsx
- location_hint: line:439
- evidence_excerpt:

```text
<p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>
```

- why: Inline styling often conflicts with centralized styling standards in large codebases.
- fix: Migrate to StyleX tokens/rules or document this as an explicit architecture exception.
- effort: small
- defer_risk: Inline styles can drift from project styling rules and reduce consistency.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-010

- finding_id: F-010
- rule_id: CHK.REACT.INLINE-STYLE
- severity: MEDIUM
- confidence: high
- location_path: apps/react-router/src/App.tsx
- location_hint: line:449
- evidence_excerpt:

```text
<div style={{ maxWidth: '20rem' }}>
```

- why: Inline styling often conflicts with centralized styling standards in large codebases.
- fix: Migrate to StyleX tokens/rules or document this as an explicit architecture exception.
- effort: small
- defer_risk: Inline styles can drift from project styling rules and reduce consistency.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-011

- finding_id: F-011
- rule_id: CHK.REACT.INLINE-STYLE
- severity: MEDIUM
- confidence: high
- location_path: apps/react-router/src/App.tsx
- location_hint: line:459
- evidence_excerpt:

```text
<p style={{ color: '#6b7280', fontSize: 13, marginTop: 8 }}>
```

- why: Inline styling often conflicts with centralized styling standards in large codebases.
- fix: Migrate to StyleX tokens/rules or document this as an explicit architecture exception.
- effort: small
- defer_risk: Inline styles can drift from project styling rules and reduce consistency.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-012

- finding_id: F-012
- rule_id: CHK.REACT.INLINE-STYLE
- severity: MEDIUM
- confidence: high
- location_path: apps/react-router/src/App.tsx
- location_hint: line:471
- evidence_excerpt:

```text
<div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
```

- why: Inline styling often conflicts with centralized styling standards in large codebases.
- fix: Migrate to StyleX tokens/rules or document this as an explicit architecture exception.
- effort: small
- defer_risk: Inline styles can drift from project styling rules and reduce consistency.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-013

- finding_id: F-013
- rule_id: CHK.REACT.INLINE-STYLE
- severity: MEDIUM
- confidence: high
- location_path: apps/react-router/src/App.tsx
- location_hint: line:476
- evidence_excerpt:

```text
style={{ alignSelf: 'center', color: '#6b7280', fontSize: 14 }}
```

- why: Inline styling often conflicts with centralized styling standards in large codebases.
- fix: Migrate to StyleX tokens/rules or document this as an explicit architecture exception.
- effort: small
- defer_risk: Inline styles can drift from project styling rules and reduce consistency.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-014

- finding_id: F-014
- rule_id: CHK.REACT.INLINE-STYLE
- severity: MEDIUM
- confidence: high
- location_path: apps/react-router/src/App.tsx
- location_hint: line:482
- evidence_excerpt:

```text
style={{
```

- why: Inline styling often conflicts with centralized styling standards in large codebases.
- fix: Migrate to StyleX tokens/rules or document this as an explicit architecture exception.
- effort: small
- defer_risk: Inline styles can drift from project styling rules and reduce consistency.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-015

- finding_id: F-015
- rule_id: CHK.REACT.INLINE-STYLE
- severity: MEDIUM
- confidence: high
- location_path: apps/react-router/src/App.tsx
- location_hint: line:555
- evidence_excerpt:

```text
style={{
```

- why: Inline styling often conflicts with centralized styling standards in large codebases.
- fix: Migrate to StyleX tokens/rules or document this as an explicit architecture exception.
- effort: small
- defer_risk: Inline styles can drift from project styling rules and reduce consistency.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-016

- finding_id: F-016
- rule_id: CHK.REACT.INLINE-STYLE
- severity: MEDIUM
- confidence: high
- location_path: apps/react-router/src/App.tsx
- location_hint: line:570
- evidence_excerpt:

```text
style={{
```

- why: Inline styling often conflicts with centralized styling standards in large codebases.
- fix: Migrate to StyleX tokens/rules or document this as an explicit architecture exception.
- effort: small
- defer_risk: Inline styles can drift from project styling rules and reduce consistency.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-017

- finding_id: F-017
- rule_id: CHK.REACT.INLINE-STYLE
- severity: MEDIUM
- confidence: high
- location_path: apps/react-router/src/App.tsx
- location_hint: line:611
- evidence_excerpt:

```text
style={{
```

- why: Inline styling often conflicts with centralized styling standards in large codebases.
- fix: Migrate to StyleX tokens/rules or document this as an explicit architecture exception.
- effort: small
- defer_risk: Inline styles can drift from project styling rules and reduce consistency.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-018

- finding_id: F-018
- rule_id: CHK.REACT.INLINE-STYLE
- severity: MEDIUM
- confidence: high
- location_path: apps/react-router/src/App.tsx
- location_hint: line:643
- evidence_excerpt:

```text
style={{
```

- why: Inline styling often conflicts with centralized styling standards in large codebases.
- fix: Migrate to StyleX tokens/rules or document this as an explicit architecture exception.
- effort: small
- defer_risk: Inline styles can drift from project styling rules and reduce consistency.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-019

- finding_id: F-019
- rule_id: TS.ANY-LEAK
- severity: MEDIUM
- confidence: medium
- location_path: apps/react-router/src/App.tsx
- location_hint: line:648
- evidence_excerpt:

```text
<p>You can put any content here, including other components.</p>
```

- why: The any type weakens static guarantees and can hide invalid assumptions.
- fix: Replace any with unknown plus type guards or a concrete type.
- effort: small
- defer_risk: Any leaks can propagate unsafe values across module boundaries.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-020

- finding_id: F-020
- rule_id: CHK.REACT.INLINE-STYLE
- severity: MEDIUM
- confidence: high
- location_path: apps/react-router/src/App.tsx
- location_hint: line:656
- evidence_excerpt:

```text
style={{
```

- why: Inline styling often conflicts with centralized styling standards in large codebases.
- fix: Migrate to StyleX tokens/rules or document this as an explicit architecture exception.
- effort: small
- defer_risk: Inline styles can drift from project styling rules and reduce consistency.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-021

- finding_id: F-021
- rule_id: TS.DOUBLE-ASSERTION
- severity: MEDIUM
- confidence: high
- location_path: apps/react-router/src/components/DraggableList/utils/handleDragOver.util.test.ts
- location_hint: line:10
- evidence_excerpt:

```text
} as unknown as React.DragEvent<HTMLLIElement>;
```

- why: Double assertion bypasses structural checks and weakens TypeScript guarantees.
- fix: Replace double assertions with explicit union types and narrowing guards.
- effort: small
- defer_risk: Type safety can silently degrade and hide runtime defects.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-022

- finding_id: F-022
- rule_id: TS.DOUBLE-ASSERTION
- severity: MEDIUM
- confidence: high
- location_path: apps/react-router/src/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/ColumnDrawerContext.context.ts
- location_hint: line:9
- evidence_excerpt:

```text
} as unknown as ColumnDrawerContextValue);
```

- why: Double assertion bypasses structural checks and weakens TypeScript guarantees.
- fix: Replace double assertions with explicit union types and narrowing guards.
- effort: small
- defer_risk: Type safety can silently degrade and hide runtime defects.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-023

- finding_id: F-023
- rule_id: TS.DOUBLE-ASSERTION
- severity: MEDIUM
- confidence: high
- location_path: apps/react-router/src/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/utils/getTableColumnDrawerState.util.test.ts
- location_hint: line:30
- evidence_excerpt:

```text
} as unknown as TableColumnsState<Record<string, unknown>>;
```

- why: Double assertion bypasses structural checks and weakens TypeScript guarantees.
- fix: Replace double assertions with explicit union types and narrowing guards.
- effort: small
- defer_risk: Type safety can silently degrade and hide runtime defects.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-024

- finding_id: F-024
- rule_id: TS.DOUBLE-ASSERTION
- severity: MEDIUM
- confidence: high
- location_path: apps/react-router/src/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/utils/getTableColumnDrawerState.util.test.ts
- location_hint: line:56
- evidence_excerpt:

```text
} as unknown as TableColumnsState<Record<string, unknown>>;
```

- why: Double assertion bypasses structural checks and weakens TypeScript guarantees.
- fix: Replace double assertions with explicit union types and narrowing guards.
- effort: small
- defer_risk: Type safety can silently degrade and hide runtime defects.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-025

- finding_id: F-025
- rule_id: TS.ANY-LEAK
- severity: MEDIUM
- confidence: medium
- location_path: apps/react-router/src/components/Table/contexts/FiltersData/filters/actions/useFetchFilterData.hook.test.ts
- location_hint: line:234
- evidence_excerpt:

```text
fetchFn: expect.any(Function),
```

- why: The any type weakens static guarantees and can hide invalid assumptions.
- fix: Replace any with unknown plus type guards or a concrete type.
- effort: small
- defer_risk: Any leaks can propagate unsafe values across module boundaries.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-026

- finding_id: F-026
- rule_id: TS.DOUBLE-ASSERTION
- severity: MEDIUM
- confidence: high
- location_path: apps/react-router/src/components/Table/contexts/TableConfig/TableConfigContext.context.ts
- location_hint: line:10
- evidence_excerpt:

```text
} as unknown as TableConfigContextValue);
```

- why: Double assertion bypasses structural checks and weakens TypeScript guarantees.
- fix: Replace double assertions with explicit union types and narrowing guards.
- effort: small
- defer_risk: Type safety can silently degrade and hide runtime defects.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-027

- finding_id: F-027
- rule_id: TS.DOUBLE-ASSERTION
- severity: MEDIUM
- confidence: high
- location_path: apps/react-router/src/components/Table/contexts/TableData/data/actions/useFetchMoreData.hook.ts
- location_hint: line:69
- evidence_excerpt:

```text
: ([] as unknown as TData[]);
```

- why: Double assertion bypasses structural checks and weakens TypeScript guarantees.
- fix: Replace double assertions with explicit union types and narrowing guards.
- effort: small
- defer_risk: Type safety can silently degrade and hide runtime defects.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-028

- finding_id: F-028
- rule_id: TS.DOUBLE-ASSERTION
- severity: MEDIUM
- confidence: high
- location_path: apps/react-router/src/components/Table/contexts/TableData/TableDataContext.context.ts
- location_hint: line:15
- evidence_excerpt:

```text
} as unknown as TableDataContextValue);
```

- why: Double assertion bypasses structural checks and weakens TypeScript guarantees.
- fix: Replace double assertions with explicit union types and narrowing guards.
- effort: small
- defer_risk: Type safety can silently degrade and hide runtime defects.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-029

- finding_id: F-029
- rule_id: TS.DOUBLE-ASSERTION
- severity: MEDIUM
- confidence: high
- location_path: apps/react-router/src/components/Table/filters/FilterInputs/FilterInputs.component.tsx
- location_hint: line:76
- evidence_excerpt:

```text
value: undefined as unknown as number,
```

- why: Double assertion bypasses structural checks and weakens TypeScript guarantees.
- fix: Replace double assertions with explicit union types and narrowing guards.
- effort: small
- defer_risk: Type safety can silently degrade and hide runtime defects.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-030

- finding_id: F-030
- rule_id: TS.DOUBLE-ASSERTION
- severity: MEDIUM
- confidence: high
- location_path: apps/react-router/src/components/Table/filters/NumberFilterInput/NumberFilterInput.component.tsx
- location_hint: line:28
- evidence_excerpt:

```text
value: val === '' ? (undefined as unknown as number) : val,
```

- why: Double assertion bypasses structural checks and weakens TypeScript guarantees.
- fix: Replace double assertions with explicit union types and narrowing guards.
- effort: small
- defer_risk: Type safety can silently degrade and hide runtime defects.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-031

- finding_id: F-031
- rule_id: TS.DOUBLE-ASSERTION
- severity: MEDIUM
- confidence: high
- location_path: apps/react-router/src/components/Table/filters/NumberFilterInput/NumberFilterInput.component.tsx
- location_hint: line:36
- evidence_excerpt:

```text
value: val === '' ? (undefined as unknown as number) : val,
```

- why: Double assertion bypasses structural checks and weakens TypeScript guarantees.
- fix: Replace double assertions with explicit union types and narrowing guards.
- effort: small
- defer_risk: Type safety can silently degrade and hide runtime defects.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-032

- finding_id: F-032
- rule_id: TS.ANY-LEAK
- severity: MEDIUM
- confidence: medium
- location_path: apps/react-router/src/components/Table/hooks/useColumnResize.hook.test.ts
- location_hint: line:127
- evidence_excerpt:

```text
expect.any(Function),
```

- why: The any type weakens static guarantees and can hide invalid assumptions.
- fix: Replace any with unknown plus type guards or a concrete type.
- effort: small
- defer_risk: Any leaks can propagate unsafe values across module boundaries.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-033

- finding_id: F-033
- rule_id: TS.ANY-LEAK
- severity: MEDIUM
- confidence: medium
- location_path: apps/react-router/src/components/Table/hooks/useColumnResize.hook.test.ts
- location_hint: line:131
- evidence_excerpt:

```text
expect.any(Function),
```

- why: The any type weakens static guarantees and can hide invalid assumptions.
- fix: Replace any with unknown plus type guards or a concrete type.
- effort: small
- defer_risk: Any leaks can propagate unsafe values across module boundaries.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-034

- finding_id: F-034
- rule_id: TS.DOUBLE-ASSERTION
- severity: MEDIUM
- confidence: high
- location_path: apps/react-router/src/components/Table/hooks/useColumnResize.hook.test.ts
- location_hint: line:32
- evidence_excerpt:

```text
}) as unknown as React.MouseEvent<HTMLDivElement>;
```

- why: Double assertion bypasses structural checks and weakens TypeScript guarantees.
- fix: Replace double assertions with explicit union types and narrowing guards.
- effort: small
- defer_risk: Type safety can silently degrade and hide runtime defects.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-035

- finding_id: F-035
- rule_id: TS.ANY-LEAK
- severity: MEDIUM
- confidence: medium
- location_path: apps/react-router/src/components/Table/hooks/useInfiniteScroll.hook.test.ts
- location_hint: line:167
- evidence_excerpt:

```text
expect.any(Function),
```

- why: The any type weakens static guarantees and can hide invalid assumptions.
- fix: Replace any with unknown plus type guards or a concrete type.
- effort: small
- defer_risk: Any leaks can propagate unsafe values across module boundaries.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-036

- finding_id: F-036
- rule_id: TS.DOUBLE-ASSERTION
- severity: MEDIUM
- confidence: high
- location_path: apps/react-router/src/components/Table/Table.component.tsx
- location_hint: line:24
- evidence_excerpt:

```text
: ([] as unknown as TData[]);
```

- why: Double assertion bypasses structural checks and weakens TypeScript guarantees.
- fix: Replace double assertions with explicit union types and narrowing guards.
- effort: small
- defer_risk: Type safety can silently degrade and hide runtime defects.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-037

- finding_id: F-037
- rule_id: TS.DOUBLE-ASSERTION
- severity: MEDIUM
- confidence: high
- location_path: apps/react-router/src/components/Table/TableLayout/createLazyTableLayout.ts
- location_hint: line:27
- evidence_excerpt:

```text
default: m.TableLayout as unknown as ComponentType<
```

- why: Double assertion bypasses structural checks and weakens TypeScript guarantees.
- fix: Replace double assertions with explicit union types and narrowing guards.
- effort: small
- defer_risk: Type safety can silently degrade and hide runtime defects.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-038

- finding_id: F-038
- rule_id: TS.DOUBLE-ASSERTION
- severity: MEDIUM
- confidence: high
- location_path: apps/react-router/src/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSectionContext/ColumnOrderSectionContext.constants.ts
- location_hint: line:15
- evidence_excerpt:

```text
pendingOrder: [] as unknown as ColumnOrderState,
```

- why: Double assertion bypasses structural checks and weakens TypeScript guarantees.
- fix: Replace double assertions with explicit union types and narrowing guards.
- effort: small
- defer_risk: Type safety can silently degrade and hide runtime defects.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-039

- finding_id: F-039
- rule_id: TS.DOUBLE-ASSERTION
- severity: MEDIUM
- confidence: high
- location_path: apps/react-router/src/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSectionContext/ColumnOrderSectionContext.context.ts
- location_hint: line:10
- evidence_excerpt:

```text
} as unknown as ColumnOrderSectionContextValue);
```

- why: Double assertion bypasses structural checks and weakens TypeScript guarantees.
- fix: Replace double assertions with explicit union types and narrowing guards.
- effort: small
- defer_risk: Type safety can silently degrade and hide runtime defects.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-040

- finding_id: F-040
- rule_id: TS.ANY-LEAK
- severity: MEDIUM
- confidence: medium
- location_path: apps/react-router/src/components/Table/TableSettingsDrawer/ColumnOrderSection/utils/buildAllOrderedColumns.util.ts
- location_hint: line:14
- evidence_excerpt:

```text
* Appends any columns not present in columnOrder at the end.
```

- why: The any type weakens static guarantees and can hide invalid assumptions.
- fix: Replace any with unknown plus type guards or a concrete type.
- effort: small
- defer_risk: Any leaks can propagate unsafe values across module boundaries.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-041

- finding_id: F-041
- rule_id: TS.DOUBLE-ASSERTION
- severity: MEDIUM
- confidence: high
- location_path: apps/react-router/src/components/Table/TableSettingsDrawer/FiltersSection/validateFilter.util.test.ts
- location_hint: line:7
- evidence_excerpt:

```text
const filterValue = void 0 as unknown as Parameters<
```

- why: Double assertion bypasses structural checks and weakens TypeScript guarantees.
- fix: Replace double assertions with explicit union types and narrowing guards.
- effort: small
- defer_risk: Type safety can silently degrade and hide runtime defects.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-042

- finding_id: F-042
- rule_id: TS.DOUBLE-ASSERTION
- severity: MEDIUM
- confidence: high
- location_path: apps/react-router/src/components/Table/TableSettingsDrawer/TableDrawerContext/TableDrawerContext.context.ts
- location_hint: line:9
- evidence_excerpt:

```text
} as unknown as TableDrawerContextValue);
```

- why: Double assertion bypasses structural checks and weakens TypeScript guarantees.
- fix: Replace double assertions with explicit union types and narrowing guards.
- effort: small
- defer_risk: Type safety can silently degrade and hide runtime defects.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-043

- finding_id: F-043
- rule_id: TS.DOUBLE-ASSERTION
- severity: MEDIUM
- confidence: high
- location_path: apps/react-router/src/components/Tooltip/Tooltip.component.tsx
- location_hint: line:61
- evidence_excerpt:

```text
hideTimeoutRef.current = timeoutId as unknown as number;
```

- why: Double assertion bypasses structural checks and weakens TypeScript guarantees.
- fix: Replace double assertions with explicit union types and narrowing guards.
- effort: small
- defer_risk: Type safety can silently degrade and hide runtime defects.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-044

- finding_id: F-044
- rule_id: TS.DOUBLE-ASSERTION
- severity: MEDIUM
- confidence: high
- location_path: apps/react-router/src/components/VirtualSelect/utils/countVisibleTags.util.test.ts
- location_hint: line:16
- evidence_excerpt:

```text
({ children }) as unknown as HTMLDivElement;
```

- why: Double assertion bypasses structural checks and weakens TypeScript guarantees.
- fix: Replace double assertions with explicit union types and narrowing guards.
- effort: small
- defer_risk: Type safety can silently degrade and hide runtime defects.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-045

- finding_id: F-045
- rule_id: TS.ANY-LEAK
- severity: MEDIUM
- confidence: medium
- location_path: apps/react-router/src/constants/pinningPreferences.constants.ts
- location_hint: line:17
- evidence_excerpt:

```text
'Apply the new column order and remove any pinning that no longer matches.',
```

- why: The any type weakens static guarantees and can hide invalid assumptions.
- fix: Replace any with unknown plus type guards or a concrete type.
- effort: small
- defer_risk: Any leaks can propagate unsafe values across module boundaries.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-046

- finding_id: F-046
- rule_id: TS.ANY-LEAK
- severity: MEDIUM
- confidence: medium
- location_path: apps/react-router/src/constants/pinningPreferences.constants.ts
- location_hint: line:88
- evidence_excerpt:

```text
'Pin this column in place without reordering any other columns',
```

- why: The any type weakens static guarantees and can hide invalid assumptions.
- fix: Replace any with unknown plus type guards or a concrete type.
- effort: small
- defer_risk: Any leaks can propagate unsafe values across module boundaries.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-047

- finding_id: F-047
- rule_id: TS.ANY-LEAK
- severity: MEDIUM
- confidence: medium
- location_path: apps/react-router/src/hooks/useClickOutside.hook.test.ts
- location_hint: line:70
- evidence_excerpt:

```text
expect.any(Function),
```

- why: The any type weakens static guarantees and can hide invalid assumptions.
- fix: Replace any with unknown plus type guards or a concrete type.
- effort: small
- defer_risk: Any leaks can propagate unsafe values across module boundaries.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-048

- finding_id: F-048
- rule_id: TS.DOUBLE-ASSERTION
- severity: MEDIUM
- confidence: high
- location_path: apps/react-router/src/root/Root.component.test.tsx
- location_hint: line:116
- evidence_excerpt:

```text
) as unknown as typeof fetch;
```

- why: Double assertion bypasses structural checks and weakens TypeScript guarantees.
- fix: Replace double assertions with explicit union types and narrowing guards.
- effort: small
- defer_risk: Type safety can silently degrade and hide runtime defects.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-049

- finding_id: F-049
- rule_id: TS.DOUBLE-ASSERTION
- severity: MEDIUM
- confidence: high
- location_path: apps/react-router/src/root/Root.component.test.tsx
- location_hint: line:146
- evidence_excerpt:

```text
) as unknown as typeof fetch;
```

- why: Double assertion bypasses structural checks and weakens TypeScript guarantees.
- fix: Replace double assertions with explicit union types and narrowing guards.
- effort: small
- defer_risk: Type safety can silently degrade and hide runtime defects.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-050

- finding_id: F-050
- rule_id: TS.DOUBLE-ASSERTION
- severity: MEDIUM
- confidence: high
- location_path: apps/react-router/src/root/Root.component.test.tsx
- location_hint: line:160
- evidence_excerpt:

```text
) as unknown as typeof fetch;
```

- why: Double assertion bypasses structural checks and weakens TypeScript guarantees.
- fix: Replace double assertions with explicit union types and narrowing guards.
- effort: small
- defer_risk: Type safety can silently degrade and hide runtime defects.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-055

- finding_id: F-055
- rule_id: TS.ANY-LEAK
- severity: MEDIUM
- confidence: medium
- location_path: apps/react-router/src/utils/performance/renderTracker.util.test.ts
- location_hint: line:33
- evidence_excerpt:

```text
renderTimes: expect.any(Array),
```

- why: The any type weakens static guarantees and can hide invalid assumptions.
- fix: Replace any with unknown plus type guards or a concrete type.
- effort: small
- defer_risk: Any leaks can propagate unsafe values across module boundaries.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-056

- finding_id: F-056
- rule_id: TS.ANY-LEAK
- severity: MEDIUM
- confidence: medium
- location_path: apps/react-router/src/utils/theme/theme-cookie.util.test.ts
- location_hint: line:96
- evidence_excerpt:

```text
body: expect.any(FormData),
```

- why: The any type weakens static guarantees and can hide invalid assumptions.
- fix: Replace any with unknown plus type guards or a concrete type.
- effort: small
- defer_risk: Any leaks can propagate unsafe values across module boundaries.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

### Finding F-057

- finding_id: F-057
- rule_id: TS.ANY-LEAK
- severity: MEDIUM
- confidence: medium
- location_path: apps/react-router/utils/fixReactRouterAssets.plugin.ts
- location_hint: line:95
- evidence_excerpt:

```text
* pre-creates any missing CSS files in the server assets directory so the
```

- why: The any type weakens static guarantees and can hide invalid assumptions.
- fix: Replace any with unknown plus type guards or a concrete type.
- effort: small
- defer_risk: Any leaks can propagate unsafe values across module boundaries.
- verification_steps:
  - Run `vp check` and confirm static checks pass.
  - Run `vp run test` and verify no behavioral regressions.
- status: open

## Prioritized Execution Queue

1. queue_rank: 1

- target_finding_ids: F-001
- reason_for_order: Higher-severity and higher-confidence findings should be addressed first.
- expected_outcome: Reduce immediate maintainability and correctness risk in the audited area.

2. queue_rank: 2

- target_finding_ids: F-002
- reason_for_order: Higher-severity and higher-confidence findings should be addressed first.
- expected_outcome: Reduce immediate maintainability and correctness risk in the audited area.

3. queue_rank: 3

- target_finding_ids: F-003
- reason_for_order: Higher-severity and higher-confidence findings should be addressed first.
- expected_outcome: Reduce immediate maintainability and correctness risk in the audited area.

## Deferred Items

None.

## Validation Checklist

- [x] Required sections present
- [x] Required metadata fields present
- [x] Summary counts match findings
- [x] Each finding has evidence_excerpt, why, fix
- [x] Each finding has verification_steps
- [x] Severity values are canonical
- [x] Prioritized queue present when findings exist

## Closure Criteria

- All HIGH findings are fixed or explicitly deferred with owner/rationale.
- Type-safe alternatives replace broad assertions and suppression directives.
- `vp check` and `vp run test` pass after remediation.
