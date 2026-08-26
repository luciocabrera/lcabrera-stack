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
  - .github/**
started: 2026-08-26
updated: 2026-08-26
plan: (none)
pr: (none)
issue: #955
---

## What

chore(repo): rename the repository

## Status / next

- Current step: repository renamed on GitHub; 55 files repointed; Sonar key left
  alone per #954; changeset for all ten published packages. check:safe exit 0.
- Blockers: none
- Next: the two settings actions are Lucio's — 10 npm trusted publishers, and a
  Sonar re-bind (which turned out to be automatic; see the PR).
