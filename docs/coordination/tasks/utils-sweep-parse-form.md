---
id: utils-sweep-parse-form
title: Promote pure parse/form utils into @repo/utils + dedup isCheckboxChecked
owner: agent:claude
status: active
branch: utils-sweep-parse-form
area:
  - packages/utils/**
  - apps/react-router/src/routes/api/**
  - apps/react-router/src/routes/enterprise-orders/config/**
  - apps/admin_system/src/routes/cqms/**
started: 2026-07-20
updated: 2026-07-20
plan: (none)
pr: (none)
issue: #132
---

## What

PR2a of the util consolidation (#132). Promote the framework-agnostic **pure**
parse/form helpers that lived in the `react-router` app (and a duplicate copy in
`admin_system`) into `@repo/utils`, renamed to kebab-case with one explicit
subpath export each:

- `parsePositiveInteger` → `@repo/utils/numbers/parse-positive-integer.util`
- `roundToCents` → `@repo/utils/numbers/round-to-cents.util`
- `safeJsonParse` → `@repo/utils/json/safe-json-parse.util`
- `readFormString` → `@repo/utils/forms/read-form-string.util`
- `isCheckboxChecked` → `@repo/utils/forms/is-checkbox-checked.util`

`isCheckboxChecked` existed as **two identical copies** (react-router +
admin_system); this consolidates them onto one shared util and rewires all 6
importers (1 react-router + 5 admin_system). App-specific JSDoc (ADR-005,
"money columns", "the Zod schema") is genericized on the way in, and the local
`*Args` types are delocalized to match the existing `@repo/utils` convention.
No new workspace deps — both apps already depend on `@repo/utils`.

`parseFilterOptionsParams` (which imports `parsePositiveInteger`) stays in the
app for now; it moves to `@repo/data-access` in PR2b with its `@repo/ui`
`DEFAULT_FILTER_PAGE_SIZE` default injected as an argument.

## Status / next

- Current step: moves + dedup + rewires + exports + docs done; running the gate.
- Blockers: none.
- Next: gate green → push → PR → merge. Then PR2b (parseFilterOptionsParams → data-access).
