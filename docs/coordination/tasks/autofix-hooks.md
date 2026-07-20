---
id: autofix-hooks
title: chore(tooling): per-file autofix quality hooks (Claude Code)
owner: agent:claude
status: review
branch: docs/document-autofix-hook
area:
  - scripts/claude-autofix.mjs
  - .claude/README.md
started: 2026-07-20
updated: 2026-07-20
plan: (none)
pr: '#131'
issue: #130
---

## What

Per-file autofix Claude Code hooks. Hook 1 — the PostToolUse fast-trio autofix
(`scripts/claude-autofix.mjs` + `.claude/settings.json`) — shipped in #129. This
claim covers landing its `.claude/README.md` docs (which missed the #129 squash
merge) and owning the hooks area for the next hook.

## Status / next

- Current step: re-landing the README docs in a tracked PR
- Blockers: none
- Next: scope the next quality hook under #130
