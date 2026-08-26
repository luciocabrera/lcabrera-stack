---
id: auth-secret-production-guard
title: fix(showcase): AUTH_TOKEN_SECRET falls back to a published default with no production guard
owner: agent:claude
status: review
branch: chore/968-auth-secret-production-guard
area:
  - apps/showcase/src/auth/**
started: 2026-08-26
updated: 2026-08-26
plan: (none)
pr: '#972'
issue: #968
---

## What

fix(showcase): AUTH_TOKEN_SECRET falls back to a published default with no production guard

## Status / next

- Current step: the published defaults are withheld when `NODE_ENV=production`,
  so the parse fails by name instead of signing tokens with a repo-readable
  string. Same treatment for `AUTH_DEMO_PASSWORD_HASH`; `AUTH_DEMO_EMAIL` keeps
  its default. Guard proved to fire — neutralising it fails exactly the three
  tests that assert it.
- Blockers: none
- Next: review rounds on #972, then merge.
