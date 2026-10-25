---
id: fix-1487-audit-patched-deps
title: Install the patched body-parser and fast-uri
owner: agent:claude
status: review
branch: fix/1487-fix-1487-audit-patched-deps
area:
  - pnpm-lock.yaml
  - docs/agents/dependency-advisories.json
  - packages/devkit/assets/workspace/docs/agents/dependency-advisories.json
  - .changeset/devkit-drop-withdrawn-braces-allowance.md
started: 2026-10-25
updated: 2026-10-25
plan: (none)
pr: '#1488'
issue: #1487
---

## What

Install the patched body-parser and fast-uri

## Status / next

- Current step: gate green except the Docker-bound workspace:verify steps; PR ready
- Blockers: none
- Next:
