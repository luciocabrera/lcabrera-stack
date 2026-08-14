---
id: api-base-url-precedence
title: Decide VITE_API_URL vs the SSR request host
owner: agent:claude
status: review
branch: chore/705-api-base-url-precedence
area:
  - packages/api/**
  - apps/react-router/src/services/**
  - apps/react-router/src/INVENTORY.md
  - apps/react-router/docs/**
  - .changeset/api-base-url-precedence.md
started: 2026-08-14
updated: 2026-08-14
plan: (none)
pr: #718
issue: #705
---

## What

Decide whether `VITE_API_URL` outranks the SSR `requestUrl` inside
`@lcabrera/api`'s `getApiBaseUrl`, and either make the change or document the
refusal.

**Decided: it outranks.** The request URL stays priority 2 — it keeps the job it
actually had, since SSR has no `location` to derive an origin from — but it no
longer swallows the variable. The app-side `resolveExternalApiBaseUrl` inversion
and its `readExternalApiUrl` helper are deleted; the fetchers pass
`getApiBaseUrl` directly.

## Status / next

- Current step: implemented, quality gate run, PR #718 updated
- Blockers: none
- Next: verification
