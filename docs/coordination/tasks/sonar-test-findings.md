---
id: sonar-test-findings
title: Fix the 20 test-quality findings Sonar surfaced
owner: agent:claude
status: review
branch: sonar-test-findings
area:
  - packages/ui/src/**/*.test.*
  - apps/admin_system/src/routes/cqms/project-detail/**
started: 2026-07-22
updated: 2026-07-22
plan: (none)
pr: #268
issue: #262
---

## What

Enabling Sonar analysis on test files (#262) surfaced 20 findings, all on test
files and none on source. Seventeen are fixed here; three are verified false
positives that need marking in the SonarCloud UI.

| Rule                               | Fixed | False positive |
| ---------------------------------- | ----- | -------------- |
| `S5906` (generic length assertion) | 11    | –              |
| `S5976` (near-identical tests)     | 4     | –              |
| `S8980` (redundant `act()`)        | 2     | 3              |

## The three false positives, each verified by removal

1. `ProjectGrantsPanel.component.test.tsx` — removing the `await act(async …)`
   around `render` fails **all four** tests with the Suspense fallback still on
   screen. RTL's `render()` calls `act()` un-awaited, so a tree suspended on
   `use()` never resolves.
2. `CopyButton.test.tsx` (second) — the "Copied" label flips only after the
   clipboard promise resolves. `findByRole` cannot substitute: the suite runs
   on fake timers, so `waitFor`'s polling never advances and it times out at
   5s.
3. `useDismissNotificationAction.hook.test.tsx` (first) — asserts on store
   state read through the hook, so the update must be flushed. Its sibling in
   the same file asserts on a spy and genuinely did not need the wrapper.

Each needs accepting in SonarCloud with that justification; `packages/ui` never
baselines, so a real finding there would have been fixed instead.

## Status / next

- Complete; gate green. Awaiting review on #268.
