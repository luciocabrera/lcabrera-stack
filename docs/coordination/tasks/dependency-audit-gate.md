---
id: dependency-audit-gate
title: Gate dependency vulnerabilities (#516 Finding 2)
owner: agent:claude
status: review
branch: feat/516-dependency-audit-gate
area:
  - scripts/verify-deps-audit.mjs
  - scripts/lib/deps-audit.mjs
  - docs/agents/dependency-advisories.json
  - docs/agents/dependency-advisories.md
  - .github/workflows/deps-audit.yml
started: 2026-08-04
updated: 2026-08-04
plan: (none)
pr: (none)
issue: https://github.com/luciocabrera/vite-react-compiler/issues/516
---

## What

#516 Finding 2 — the repo gated command docs, ADR numbering, script size,
coordination integrity, published API surface and four linters, but nothing
watched its supply chain. Adds `vp run deps:audit`: a gate over
`vp pm audit --json`, an allowance register with required expiry dates, a CI
step, and a daily scheduled run that files one tracking issue.

The design point is that the gate refuses a report that walked no dependencies.
An unreachable registry produces the same empty advisory list as a healthy tree,
and a supply-chain check that goes green when it could not run is worse than
none.

## Status / next

- Current step: gate green, fires on every planted case; opening the PR.
- Blockers: none.
- Next: the remaining #516 findings (3, 6, 7) are separate decisions.
