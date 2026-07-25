---
id: lockfile-regen
title: Regenerate the lockfile from scratch so stale resolutions cannot persist
owner: agent:claude
status: review
branch: build/413-lockfile-regen
area:
  - pnpm-lock.yaml
  - pnpm-workspace.yaml
  - scripts/deps-refresh.sh
started: 2026-07-25
updated: 2026-07-25
plan: (none)
pr: '#414'
issue: #413
---

## What

The committed lockfile carried resolutions no manifest reaches any more —
`supports-color@5.5.0` peer-suffix keys, 158 references where 31 are real. An
ordinary `vp install` never drops them, because pnpm does not re-resolve a peer
it can already satisfy; only `pnpm clean --lockfile` followed by a fresh install
does.

- Commit the regenerated lockfile. No package or version changed; 368 orphaned
  lines go.
- Stop `deps-refresh.sh` discarding that cleanup. It reverted the lockfile
  whenever no version moved, on the theory that pnpm reformats it with no delta.
  It does not — regeneration is idempotent — so the revert threw the cleanup away
  on every already-current day.

## Status / next

- Current step: verified and pushed; PR #414 out of draft.
- Blockers: none.
- Next: delete this file when #414 merges.
