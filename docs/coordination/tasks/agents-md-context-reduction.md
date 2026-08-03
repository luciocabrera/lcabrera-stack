---
id: agents-md-context-reduction
title: Cut derivable content from AGENTS.md and move toolchain lore to lazily-loaded skills
owner: agent:claude
status: review
branch: docs/496-agents-md-context-reduction
area:
  - AGENTS.md
  - COMMANDS.md
  - packages/CLAUDE.md
  - .github/skills/lint-toolchain/**
  - .github/skills/releasing/**
  - .github/skills/fallow-code-checker/**
  - .github/skills/commit-and-pr/**
started: 2026-08-03
updated: 2026-08-03
plan: (none)
pr: (none)
issue: #496
---

## What

`AGENTS.md` was 85,365 characters — roughly 21,300 tokens loaded by every agent in
every session before it reads a line of code. Two problems: content a session could
derive with `ls` or from `package.json`, and deep toolchain lore needed only when
_changing_ tooling config.

Deletes the derivable sections and moves the lore to tiers that load on demand — a
new `lint-toolchain` skill, a new `releasing` skill, reference docs folded into the
existing `fallow-code-checker` and `commit-and-pr` skills, and a directory-scoped
`packages/CLAUDE.md`. Every migrated section keeps a pointer in `AGENTS.md`.

All 14 Non-Negotiable Rules, §6 Security, the Post-Change Quality Gate and every
"never do X" prohibition stay resident — a safety rule inside a lazy skill is one
that may not be loaded when it matters.

## Status / next

- Current step: implemented and gates green; opening the PR.
- Blockers: none.
- Next: merge, then delete this file.
