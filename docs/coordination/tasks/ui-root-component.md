---
id: ui-root-component
title: feat(ui): own the app root in @lcabrera/ui and remove navigation prop drilling
owner: agent:claude
status: review
branch: feat/436-ui-root-component
area:
  - packages/ui/src/components/RootComponent/**
  - packages/ui/src/contexts/AppConfigContext/**
  - packages/ui/src/components/AppShell/**
  - packages/ui/src/components/AppNavigation/**
  - apps/react-router/src/root/**
  - apps/admin_system/src/root/**
started: 2026-07-25
updated: 2026-07-25
plan: (none)
pr: '#437'
issue: #436
---

## What

`@lcabrera/ui` now exports `RootComponent` — the whole root route of a consuming
app. It reads the root loader's data, composes `AppProviders` and renders
`AppShell`, so an app declares only `appId`, `defaultTheme`,
`getNavigationItems`, `isAuthEnabled` and an optional `logoutRoute`.

Consumer configuration reaches its reader through the new `AppConfigContext`
instead of being drilled: `AppShell` and `AppNavigation` lose
`getNavigationItems`/`sessionActions`, `NavigationBody` reads the items it
renders, and the footer became a thin shell over `NavigationThemeControl` and
`NavigationSessionActions` (the app's `LogoutControl`, moved into the package
and gated on `isAuthEnabled`). ADR-053.

## Status / next

- Current step: implemented, full quality gate green, PR #437 ready for review
- Blockers: none
- Next: merge and delete this file

## Area overlap — #434 / PR #435

`packages/ui/src/components/AppNavigation/**` is also claimed by
`remove-navigation-pinning` (PR #435, in review). Same owner, and the two
changes are disjoint in intent: #435 removes the pin/launcher machinery from
`AppNavigation.component.tsx` + `AppNavigation.types.ts`, this one removes the
`getNavigationItems`/`sessionActions` props from the same two files and does not
touch `NavigationHeader`, `NavigationHeaderActions` or `NavigationLauncher`.
Whichever merges second rebases; the conflict is confined to those two files.
