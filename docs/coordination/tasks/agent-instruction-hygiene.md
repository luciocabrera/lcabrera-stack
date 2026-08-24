---
id: agent-instruction-hygiene
title: tighten skills, rules, and always-on agent instructions
owner: agent:claude
status: review
branch: docs/894-agent-instruction-hygiene
area:
  - AGENTS.md
  - .claude/rules/**
  - .claude/agents/**
  - .claude/README.md
  - .github/skills/**
  - .github/workflows/validate-skills.yml
  - scripts/validate-skills.cjs
  - scripts/ARCHITECTURE.md
  - packages/devkit/assets/skills/react-19/**
  - .changeset/agent-instruction-hygiene.md
  - .devkit-manifest.json
  - .devkit-accepted.json
started: 2026-08-24
updated: 2026-08-24
plan: (none)
pr: https://github.com/luciocabrera/vite-react-compiler/pull/896
issue: #894
---

## What

tighten skills, rules, and always-on agent instructions

## Status / next

- Current step: addressing Claude review round 5 (README overclaimed that store-pattern globs closed Rule 5)
- Blockers: 1 unresolved thread `PRRT_kwDOQt2ffM6botba` (this commit restores "invoke it by name")
- Next: reply + resolve; then wait — Claude re-reviews every new head

Check from the shell: `vp run pr:threads -- --pr 896`

## Review log

Head moves after each fix, so Claude re-reviews. Keep this list current.

| When       | Head       | Open threads                                                                              | Outcome                                       |
| ---------- | ---------- | ----------------------------------------------------------------------------------------- | --------------------------------------------- |
| 2026-08-24 | `856699c9` | 3 (skills CI paths; seed points at unshipped files; ungrammatical store-pattern sentence) | Fixed `87492df9` + `ba9c7927`; all 3 resolved |
| 2026-08-24 | `ba9c7927` | 1 (manifest hash `a6560700` matched neither asset nor live file)                          | Fixed `b769ef9b`; resolved                    |
| 2026-08-24 | `b769ef9b` | 1 (changeset claimed seed matches live copy)                                              | Fixed `0de26f64`; resolved                    |
| 2026-08-24 | `0de26f64` | 1 (`paths:` filter does not run the gate when a _referenced_ script moves)                | Fixed `3eefa809`; resolved                    |
| 2026-08-24 | `3eefa809` | 1 (README claimed store-pattern globs closed Rule 5; they only cover two primitives)      | This commit: restore "invoke it by name"      |

Merge is held by `required_review_thread_resolution` (approving-review count is 0), not by failing checks.
