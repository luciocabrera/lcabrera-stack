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

- Current step: addressing Claude review round 3 (changeset describes live skill, not seed)
- Blockers: 1 unresolved review thread on `.changeset/agent-instruction-hygiene.md` (this commit)
- Next: reply + resolve that thread; then wait for the next review pass / merge

## Review log

Head moves after each fix, so Claude re-reviews. Keep this list current.

| When       | Head       | Open threads                                                                             | Outcome                                               |
| ---------- | ---------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 2026-08-24 | `856699c9` | 3 (skills CI paths; seed points at unsipped files; ungrammatical store-pattern sentence) | Fixed `87492df9` + `ba9c7927`; all 3 resolved         |
| 2026-08-24 | `ba9c7927` | 1 (manifest hash `a6560700` matched neither asset nor live file)                         | Fixed `b769ef9b`; resolved                            |
| 2026-08-24 | `b769ef9b` | 1 (changeset claims seed matches live copy; it does not)                                 | This commit; changeset rewritten to describe the seed |

CI on `b769ef9b`: Quality Gate, PR Standards, Validate Skills, Copilot review complete, Agent review verdict — all green. Merge is held by `required_review_thread_resolution`, not by failing checks.
