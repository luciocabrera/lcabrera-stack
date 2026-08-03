---
id: claude-hook-path-resolution
title: Resolve Claude Code hook scripts from the repo root, and stop the guard flagging source paths
owner: agent:claude
status: review
branch: fix/495-claude-hook-path-resolution
area:
  - .claude/settings.json
  - scripts/claude-secrets-guard.mjs
  - scripts/claude-autofix.mjs
  - scripts/lib/secrets-guard*.mjs
started: 2026-08-03
updated: 2026-08-03
plan: (none)
pr: #497
issue: #495
---

## What

Both `.claude/settings.json` hooks invoked their script by a **relative** path, so
they resolved against the invoking working directory rather than the repo root and
crashed with `Cannot find module` whenever that was not the root. Because both
hooks are non-blocking on failure, a crashed run looked exactly like a clean pass —
so the `PreToolUse` secrets guard, a security control, was silently not running.
Every recorded `PreToolUse` run across 50 sessions failed this way.

Fixing the guard's own command string surfaced a second defect: the generic
entropy rule read the **file path** `$CLAUDE_PROJECT_DIR/scripts/claude-secrets-guard.mjs`
as a hardcoded credential, so the guard blocked edits to its own wiring — and JSON
has no comment syntax to carry the sanctioned `gitleaks:allow` escape.

## Status / next

- Current step: implemented and verified; opening the PR.
- Blockers: none.
- Next: merge, then delete this file.
