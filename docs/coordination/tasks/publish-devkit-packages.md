---
id: publish-devkit-packages
title: Publish the devkit and repo-standards packages under the @lcabrera scope
owner: agent:claude
status: review
branch: feat/800-publish-devkit-packages
area:
  - packages/devkit/**
  - packages/repo-standards/**
  - packages/ts-configs/tsconfig.entries.ts
  - devkit.config.json
  - reports/api-surface/**
  - scripts/lib/publish-wiring.test.mjs
started: 2026-08-21
updated: 2026-08-21
plan: (none)
pr: #886
issue: #800
---

## What

`@repo/devkit` → `@lcabrera/devkit` and `@repo/repo-standards` →
`@lcabrera/repo-standards`, with `private` off and the enrolment that makes a
package public here: the gitignored `eslint-suppressions.json` marker
(never-baseline tier) and a place on the API-surface ratchet.

The half of #800 that only Lucio can do comes after this merges — npm's trusted
publishing binds to an **existing** package, so the first publish of each is
manual.

## Status / next

- Current step: full gate green, both Rule 14 probes recorded, awaiting review.
- Blockers: none.
- Next: manual first publish + trusted publisher configuration, then adopt the
  harness in a second repository (the remaining #800 criteria).
