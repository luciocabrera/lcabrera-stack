---
id: react-doctor-blocking
title: feat(repo-standards): fail the React Doctor gate on warnings
owner: agent:claude
status: review
branch: feat/1418-react-doctor-blocking
area:
  - packages/repo-standards/scripts/verify-react-doctor*
  - packages/repo-standards/scripts/react-doctor*
  - doctor.config.jsonc
  - docs/decisions/ADR-055-*
  - docs/agents/react-doctor-triage.md
  - docs/agents/react-doctor-facts.json
  - .changeset/*react-doctor*
  - docs/agents/public-package-suppressions.json
  - packages/repo-standards/README.md
  - COMMANDS.md
  - .github/workflows/check-safe.yml
  - packages/devkit/CLASSIFICATION.md
  - .github/skills/quality-gate-workflow/SKILL.md
  - .github/skills/quality-gate-workflow/references/daily-practice.md
started: 2026-10-19
updated: 2026-10-19
plan: (none)
pr: '#1437'
issue: #1418
---

## What

feat(repo-standards): fail the React Doctor gate on warnings

## Status / next

- Current step: implemented, gate green, PR ready
- Blockers: none
- Next:
