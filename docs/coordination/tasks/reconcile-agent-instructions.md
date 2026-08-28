---
id: reconcile-agent-instructions
title: Reconcile the instructions that tell agents opposite things
owner: agent:claude
status: review
branch: docs/993-reconcile-agent-instructions
area:
  - AGENTS.md
  - COMMANDS.md
  - package.json
  - .claude/**
  - .github/skills/**
  - .github/pull_request_template.md
  - docs/agents/**
  - docs/decisions/ADR-088-keep-living-architecture-docs-on-systems-not-on-every-folder.md
  - docs/decisions/ADR-095-move-explanations-out-of-functions-and-into-the-record-that-owns-them.md
  - docs/coordination/README.md
  - docs/tooling/coverage-reporting.md
  - docs/product/requirements/**
  - scripts/**
started: 2026-08-28
updated: 2026-08-28
plan: (none)
pr: 1027
issue: #993
---

## What

Reconcile the instructions that tell agents opposite things

## Status / next

- Current step: `origin/main` merged in; this branch's ADR renumbered to 095
  after `main` landed a different ADR-094 (#1024). Full gate green on the
  merged tree, PR #1027 open
- Blockers: none
- Next: blind verification, then merge
