---
id: 797-devkit-doctor-accept
title: Acknowledge a deliberate local edit so doctor stops repeating it
owner: agent:claude
status: active
branch: feat/797-797-devkit-doctor-accept
area:
  - packages/devkit/scripts/**
  - packages/devkit/ARCHITECTURE.md
  - packages/devkit/README.md
  - COMMANDS.md
started: 2026-08-20
updated: 2026-08-20
plan: (none)
pr: '#848'
issue: #797
---

## What

Acknowledge a deliberate local edit so doctor stops repeating it.

`devkit doctor --accept <path> --reason "<why>"` records the edit's on-disk hash
in a tracked `.devkit-accepted.json`; the default report then omits it and
`--verbose` still lists it with its reason. Editing the file again changes the
hash, so it re-reports as locally modified with no further command.

Wave 2 of #797, the `--accept` slice only. The `requires:` gate landed in #840
and the `peer:` gate in #845; both touch `sync.mjs`, `manifest.mjs` and
`command-materialise.mjs`. The conflict with #845 was textual rather than
behavioural, and the branch is now rebased onto it: `planSync` keeps #845's
`unmetDeclaration` helper and its single `unmet` state, and every entry it
returns — `unmet` included — carries `onDiskHash`.

## Status / next

- Current step: verified; rebased onto `origin/main` and gate re-run, with the
  report's state column now sized from the state vocabulary rather than a literal
- Blockers: none
- Next: nothing — the PR is #848 and is owned by the dispatcher
