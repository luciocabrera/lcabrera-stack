---
id: sonar-easy-findings
title: Clear the mechanically-fixable Sonar findings on main
owner: agent:claude
status: review
branch: sonar-easy-findings
area:
  - packages/ui/src/components/Table/utils/parseVersionedPayload.util.ts
  - packages/ui/src/utils/storage/readFromCookie.util.ts
  - packages/ui/scripts/**
  - packages/scan-ingestion/src/ingestion/workspaces/**
  - packages/scan-ingestion/src/registry/**
  - packages/scan-ingestion/src/cli/**
  - apps/admin_system/src/auth/requireApiUser.util.ts
started: 2026-07-22
updated: 2026-07-22
plan: (none)
pr: #253
issue: #249
---

## What

Nine of `main`'s open Sonar findings that are real defects with a mechanical
fix: four super-linear regexes (S8786), two redundant jumps (S3626), a nested
ternary (S3358), and two `TODO` markers that were describing generated output
rather than naming an open task (S1135).

## Deliberately not in scope

Five non-PL/SQL findings need a **SonarCloud UI** resolution, not a code
change, and are listed on #249 for the owner:

- `S6819` ×2, `S6852`, `S6478` — the analyser mismodelling correct code
  (virtualized listbox, APG tablist, conditional tooltip role, a render
  callback read as a nested component). Same class AGENTS.md already
  documents Biome being wrong about; rewriting correct code to satisfy them
  would be the workaround Rule 10 forbids.
- `S4036` on `runGit.util.ts` — already mitigated with an explicit
  `TRUSTED_PATH`, which the analyser cannot see.

The 70 remaining `plsql:*` findings are #75.

## Status / next

- Complete; gate green. Awaiting review on #253.
