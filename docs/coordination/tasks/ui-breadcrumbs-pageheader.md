---
id: ui-breadcrumbs-pageheader
title: Add Breadcrumbs, PageHeader and an inline NavLink variant
owner: agent:claude
status: review
branch: feat/1557-ui-breadcrumbs-pageheader
area:
  - packages/ui/src/components/Breadcrumbs/**
  - packages/ui/src/components/PageHeader/**
  - packages/ui/src/components/NavLink/**
  - packages/ui/src/public-api.ts
  - packages/ui/package.json
  - packages/ui/src/INVENTORY.md
  - .changeset/ui-breadcrumbs-pageheader.md
  - reports/api-surface/ui.txt
  - packages/ui/README.md
  - packages/ui/src/stylex-module-paths.test.json
  - packages/ui/src/utils/tests/compileStylexRules.util*
  - packages/ui/src/utils/tests/compositeOverSurface.util*
  - packages/ui/src/utils/tests/decodeSrgbChannel.util*
  - packages/ui/src/utils/tests/encodeSrgbChannel.util*
  - packages/ui/src/utils/tests/getColorTokenName.util*
  - packages/ui/src/utils/tests/getLuminance.util*
  - packages/ui/src/utils/tests/getThemeTokenContrast.util*
  - packages/ui/src/utils/tests/labToLinearSrgb.util*
  - packages/ui/src/utils/tests/multiplyColorMatrix.util*
  - packages/ui/src/utils/tests/oklchToLinearSrgb.util*
  - packages/ui/src/utils/tests/parseStylexRule.util*
  - packages/ui/src/utils/tests/readColor.util*
  - packages/ui/src/utils/tests/readColorChannels.util*
  - packages/ui/src/utils/tests/readStylexDeclaration.util*
  - packages/ui/src/utils/tests/readStylexRules.util*
  - packages/ui/src/utils/tests/readThemeValue.util*
  - packages/ui/src/utils/tests/tests.types.ts
started: 2026-10-30
updated: 2026-11-02
plan: (none)
pr: #1583
issue: #1557
---

## What

Add Breadcrumbs, PageHeader and an inline NavLink variant

## Status / next

- Current step: gate green; light and dark screenshots attached to the PR from the review-only branch `test/1557-ui-breadcrumbs-screenshots`, and the verifier's criterion-5 re-check passed
- Blockers: none
- Next: fresh blind review of this head, then merge
