---
id: secrets-guard-hook
title: chore(tooling): PreToolUse secrets guard for Claude Code
owner: agent:claude
status: review
branch: feat/secrets-guard-hook
area:
  - scripts/claude-secrets-guard.mjs
  - scripts/lib/secrets-guard.mjs
started: 2026-07-20
updated: 2026-07-20
plan: (none)
pr: '#134'
issue: #133
---

## What

A `PreToolUse` command hook that denies Claude Code any read of a secret/`.env`
file (Read/Grep/Glob/Bash) — sole exception `.env.example`/`.sample`/`.template`
— and blocks Write/Edit/MultiEdit that would introduce a credential. Reuses the
ADR-020 secret-file taxonomy (`packages/agent-runner/src/isSecretFilePath.util.ts`).
Also touches `.claude/settings.json` (wiring) and `.claude/README.md` (docs).

## Status / next

- Current step: building the pure core + entry, then wiring + docs
- Blockers: none
- Next: gate (selftest + fmt/lint/biome/scripts:verify/fallow), open PR
