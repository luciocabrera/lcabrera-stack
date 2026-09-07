---
id: gate-scripts-typescript
title: port the gate scripts to TypeScript as they move into the packages
owner: agent:claude
status: review
branch: refactor/1096-gate-scripts-typescript
area:
  - packages/repo-standards/**
  - packages/devkit/package.json
  - packages/create-lcabrera-stack/package.json
  - .claude/rules/scripts.md
  - .claude/rules/typescript.md
  - docs/decisions/ADR-*.md
  - docs/product/**
  - reports/api-surface/repo-standards.txt
  - .changeset/*.md
  - scripts/verify-devkit-tarball.mjs
  - scripts/lib/devkit-tarball*.mjs
  - AGENTS.md
  - packages/CLAUDE.md
  - COMMANDS.md
started: 2026-09-06
updated: 2026-09-07
plan: (none)
pr: '#1102'
issue: #1096
---

## What

port the gate scripts to TypeScript as they move into the packages

## Status / next

- Current step: in review on #1102, rebuilt on `main`. `main` now carries
  `create-lcabrera-stack`, which ships a bin, so the branch's own Node-floor
  finding fired on the merge and not on either side alone; the manifest gap it
  named is closed here, which also closes #1104
- Blockers: none
- Next: the port itself does not proceed as scoped — see ADR-111 and the PR
  body. Review findings addressed: the packed-manifest Node floor now rejects an
  empty or whitespace value, and `scripts:exits:verify` selects with the same
  predicate as the size gate, so #1111 is redundant. Follow-ups filed: #1103
  (`checkJs`), #1105 (the rules table has no gate). Whether #1096 closes on this
  answer is the owner's call
