---
id: remove-navigation-pinning
title: feat(ui): always render the navigation sidebar
owner: agent:claude
status: review
branch: feat/434-remove-navigation-pinning
area:
  - packages/ui/src/components/AppNavigation/**
  - packages/ui/src/components/Settings/**
  - packages/ui/src/contexts/GlobalSettingsContext/**
  - packages/ui/src/utils/globalSettings/**
  - packages/ui/src/types/globalSettings.types.ts
  - packages/ui/src/constants/globalSettings.constants.ts
  - apps/react-router/src/root/ARCHITECTURE.md
started: 2026-07-25
updated: 2026-07-25
plan: (none)
pr: (none)
issue: #434
---

## What

Make the application navigation sidebar permanent: remove the pin/unpin toggle,
the off-canvas close button and the floating launcher rail, along with the
`navigation.pinned` global preference that drove them. `AppNavigation` now
always renders as a pinned `<aside>`; collapsing to an icon rail remains the way
to reclaim horizontal space.

## Status / next

- Current step: implemented, quality gate green, ready for review
- Blockers: none
- Next: merge and delete this file
