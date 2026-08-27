---
id: adr-gate-reads-the-record
title: 'Make the ADR gate read the record: metadata block, section assertion, listing by package'
owner: agent:claude
status: review
branch: feat/991-adr-gate-reads-the-record
area:
  - packages/repo-standards/**
  - packages/devkit/assets/decisions/**
  - docs/decisions/_TEMPLATE.md
  - devkit.config.json
  - COMMANDS.md
  - scripts/adr-content-baseline.json
  - scripts/lib/adr-scaffold.test.mjs
  - packages/devkit/assets/root/COMMANDS.md
  - reports/api-surface/repo-standards.txt
  - .changeset/adr-gate-reads-the-record.md
started: 2026-08-27
updated: 2026-08-27
plan: (none)
pr: 1013
issue: #991
---

## What

Teach `adr:verify` to read the ADR body: a `governs` classification block held
against the derived workspace roster, the required sections (#588, landed here),
a grandfathering baseline for the records that predate the block, and
`adr:list -- --package <workspace>`.

Lands #588 as well as #991 — both teach the same gate to read the body, and
splitting them would edit `adr-registry.mjs`, `verify-adrs.mjs` and
`docs/decisions/_TEMPLATE.md` twice with a conflict in between.

## Status / next

- Current step: round 7 — dead `number` field and its import removed, both Sonar
  findings fixed, and the consumer upgrade story documented: the changeset, the
  package README and the shipped COMMANDS row now name `--adopt`, and the
  staleness message uses the home's own command instead of this repo's; the
  block and section parsing is line-ending agnostic, which it was not
- Blockers: none
- Next: awaiting review on #1013
