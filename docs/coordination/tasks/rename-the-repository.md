---
id: rename-the-repository
title: chore(repo): rename the repository
owner: agent:claude
status: review
branch: chore/955-rename-the-repository
area:
  - packages/*/package.json
  - packages/eslint-local-rules/src/**
  - README.md
  - AGENTS.md
  - package.json
  - scripts/**
  - docs/tooling/**
  - docs/agents/research/**
  - docs/decisions/**
  - .github/**
started: 2026-08-26
updated: 2026-08-26
plan: (none)
pr: '#966'
issue: #955
---

## What

chore(repo): rename the repository

## Status / next

- Current step: renamed on GitHub, tree repointed, ADR-092 records the decision.
  The Sonar key is untouched and the binding followed the rename on its own, so
  #954's prediction of a manual re-bind is corrected in the PR. Lucio has updated
  the ten npm trusted publishers. `check:safe` exit 0.
- Blockers: none
- Next: review rounds on #966, then merge — it closes epic #949.
