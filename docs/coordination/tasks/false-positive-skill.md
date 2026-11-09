---
id: false-positive-skill
title: Add the /false-positive skill and the panel contract
owner: agent:claude
status: review
branch: feat/1555-false-positive-skill
area:
  - .github/skills/false-positive/**
  - .claude/agents/fp-*.md
  - .claude/agents/refactor-builder.md
  - .claude/agents/refactor-verifier.md
  - .claude/agents/quality-gate.md
  - .github/skills/epic/**
  - .github/skills/refactor-verified/**
  - .github/skills/quality-gate-workflow/**
  - .github/skills/lint-toolchain/**
  - .github/skills/linter-checker/**
  - .github/skills/fallow-code-checker/**
  - .github/skills/code-smell-zen/**
  - .github/skills/commit-and-pr/**
  - docs/agents/false-positive-panel.md
  - .github/pull_request_template.md
  - packages/repo-standards/scripts/commit-convention.mjs
  - CLAUDE.md
  - AGENTS.md
  - COMMANDS.md
  - docs/README.md
  - .claude/README.md
  - docs/agents/epic-orchestration.md
  - docs/agents/public-package-suppressions.md
  - evals/skills/**
started: 2026-11-09
updated: 2026-11-09
plan: (none)
pr: #1607
issue: #1555
---

## What

Add the /false-positive skill and the panel contract

## Status / next

- Current step: dry run done, gate green; PR up for review
- Blockers: none
- Next: gate, PR
