---
id: break-glass-rung-seven
title: record the measured admin bypass
owner: agent:claude
status: active
branch: chore/878-break-glass-rung-seven
area:
  - docs/tooling/copilot-review-gate.md
started: 2026-08-21
updated: 2026-08-21
plan: (none)
pr: '#879'
issue: #878
---

## What

Record what the admin ruleset bypass actually does, measured on #877 (2026-08-21).

Rung 7 of the break-glass ladder was a single sentence asserting a capability nobody had
ever used, and #698 makes every stuck pull request depend on it. The rehearsal confirmed
it works and turned up UI detail that matters under pressure — the control is a
_checkbox_, not a button, and the merge button stays disabled and differently-labelled
until it is ticked.

## Status / next

- Current step: doc written, gate green
- Blockers: none
- Next: push, flip #879 out of draft, drive to merged
