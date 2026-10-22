---
id: probe-named-oxlint-rules
title: Probe each individually enabled Oxlint rule in lint:plugins:verify
owner: agent:claude
status: active
branch: feat/1448-probe-named-oxlint-rules
area:
  - packages/repo-standards/scripts/lint-plugins*
  - packages/repo-standards/scripts/verify-lint-plugins*
  - packages/repo-standards/README.md
  - packages/repo-standards/ARCHITECTURE.md
  - .changeset/probe-named-oxlint-rules.md
  - docs/decisions/ADR-042-oxlint-config-at-the-root.md
  - COMMANDS.md
  - vite.config.ts
  - packages/devkit/CLASSIFICATION.md
  - .github/skills/lint-toolchain/SKILL.md
  - .github/skills/health-swarm/charters/lint-coherence.md
started: 2026-10-22
updated: 2026-10-22
plan: (none)
pr: '#1482'
issue: #1448
---

## What

Probe each individually enabled Oxlint rule in lint:plugins:verify

## Status / next

- Current step: implemented, gate running
- Blockers: none
- Next: ready the PR once the gate is green
