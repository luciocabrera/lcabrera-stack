---
id: utils-sweep-formatters
title: Relocate the formatters subsystem (+ format.types) into @repo/utils
owner: agent:claude
status: active
branch: utils-sweep-formatters
area:
  - packages/utils/**
  - packages/ui/src/types/format.types.ts
  - packages/ui/src/components/Table/**
  - packages/ui/src/components/Form/fields/**
  - apps/admin_system/src/routes/cqms/llm-usage/**
started: 2026-07-20
updated: 2026-07-20
plan: (none)
pr: (none)
issue: #132
---

## What

PR B of the util consolidation (#132). Move the `@repo/ui` formatters subsystem —
`formatCurrency` / `formatDate` / `formatNumber` / `parseDate` /
`getDateTimeFormatOptions` / `getDefaultLocale`, plus `formatters.constants` and
the shared `format.types` option types — into `@repo/utils/formatters/*`, renamed
to kebab-case with one explicit subpath export each. They are pure `Intl` wrappers
with no React/DOM dependency, so they belong in the lowest layer.

`format.types` (previously `@repo/ui/types/format.types`) is colocated in
`utils/src/formatters/` since it is consumed only by the formatters and by
`Table.types`. Consumers rewired: 7 in `@repo/ui` (Table cell/details rendering,
Form currency/display fields, `Table.types`) and 4 in `admin_system`
(cqms/llm-usage tables). No new workspace deps — both packages already depend on
`@repo/utils` from PR A (#135).

The barrel-importing `renderCellContent` pair is de-barrelled: its `.tsx` splits
one `@repo/ui/utils/formatters` import into three explicit subpaths, and its test
mocks the three `@repo/utils/formatters/*` modules instead of the old barrel.

## Status / next

- Current step: moves + rewires + exports + docs done; running the full gate.
- Blockers: none.
- Next: gate green → push → PR → merge. Then PR2 (parse/form utils).
