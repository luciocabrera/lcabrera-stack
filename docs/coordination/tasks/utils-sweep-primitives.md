---
id: utils-sweep-primitives
title: Consolidate core framework-agnostic pure utils into @repo/utils (errors/objects/strings/guards/comparison)
owner: agent:claude
status: active
branch: utils-sweep-primitives
area:
  - packages/utils/**
  - packages/data-access/package.json
  - packages/ui/src/utils/**
  - packages/ui/src/entry/**
  - packages/ui/src/hooks/useStore.hook.ts
  - packages/ui/src/components/Table/utils/**
  - packages/ui/src/components/Form/utils/**
  - packages/scan-ingestion/src/ingestion/appGraph/**
  - apps/react-router/src/routes/enterprise-orders/config/**
  - apps/react-router/src/routes/api/**
  - apps/react-router/src/services/**
  - apps/admin_system/src/routes/cqms/**
started: 2026-07-20
updated: 2026-07-20
plan: (none)
pr: (none)
issue: #132
---

## What

PR A of the util consolidation (#132). Relocate the framework-agnostic **pure**
primitives scattered across `@repo/data-access` and `@repo/ui` into `@repo/utils`
domain folders, renamed to kebab-case `.util.ts`, and rewire every importer to the
new subpath. Vacated dirs, stale exports, and empty barrels removed.

Moves (source → target):

- `getErrorMessage` (data-access/errors) → `@repo/utils/errors/get-error-message.util`
- `toError` (ui/entry) → `@repo/utils/errors/to-error.util`
- `dropNullishValues` (data-access/records) → `@repo/utils/objects/drop-nullish-values.util`
- `emptyToUndefined` (data-access/records) → `@repo/utils/strings/empty-to-undefined.util`
- `isObject` (ui/utils/typeGuards) → `@repo/utils/guards/is-object.util`
- `areArraysEqual` / `areEqualByJson` / `isShallowEqual` (ui/utils/comparison) → `@repo/utils/comparison/*`

Also: `@repo/utils` added as a `workspace:*` dependency of every new consumer
(`@repo/ui`, `@repo/scan-ingestion`, `apps/react-router`, `apps/admin_system`);
utils README/ARCHITECTURE export lists updated; the 2 merged coordination task
files (`ui-form-field-builders`, `utils-package-parity`) deleted.

The formatters subsystem (PR B) and the parse/form utils (PR2) land separately —
each is its own concern.

## Status / next

- Current step: moves + rewires + exports + deps done; running the full quality gate.
- Blockers: none.
- Next: gate green → push → PR → merge. Then PR B (formatters).
