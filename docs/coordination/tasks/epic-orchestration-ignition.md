---
id: epic-orchestration-ignition
title: Make epic orchestration launchable with one command
owner: agent:claude
status: review
branch: feat/666-epic-orchestration-ignition
area:
  - docs/agents/epic-orchestration.md
  - .github/skills/epic/**
  - .claude/agents/refactor-builder.md
  - .claude/agents/refactor-verifier.md
  - .claude/README.md
  - AGENTS.md
started: 2026-08-13
updated: 2026-08-13
plan: (none)
pr: #667
issue: #666
---

## What

Bind "orchestrate epic N" to the contract that already describes it, so a run
starts with `/epic <n>` instead of a hand-written prompt restating the roles.

- Track `docs/agents/epic-orchestration.md` (it was untracked) and make it
  epic-agnostic — the live state of a given epic moves to that epic's issue.
- Add `.github/skills/epic/SKILL.md`, which binds the command and adds nothing.
- Make PR-ready timing and finding-posting **dispatch parameters** on
  `refactor-builder` / `refactor-verifier`, so `/epic` and `/refactor-verified`
  share one pair of agents instead of forking them.
- Delete the superseded orchestrator prompt pair under `.claude/`, reachable only
  from a VS Code task that invoked a binary which does not exist.

## Status / next

- Current step: quality gate + PR
- Blockers: none
- Next: `pr:queue` and `housekeeping:prune` dry runs, reported to the human

Two paths were dropped from the area after probing them. The `app-graph` skill dir
looked orphaned but its script is a live CQMS scanner registered in
`apps/scan-orchestrator/src/queue/queue.constants.ts` and owned by ADR-022/027 —
left untouched. The VS Code task file is gitignored, so removing it is a local
action and not part of this PR.
