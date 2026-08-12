---
id: route-folder-artifact-names
title: chore(tooling): check route-folder types/constants against the artifacts in the folder
owner: agent:claude
status: active
branch: chore/613-route-folder-artifact-names
area:
  - packages/eslint-local-rules/README.md
  - packages/eslint-local-rules/src/domain-folder-filename.ts
  - scripts/verify-route-artifacts.mjs
  - scripts/lib/route-artifacts*.mjs
  - .claude/rules/typescript.md
started: 2026-08-12
updated: 2026-08-12
plan: (none)
pr: '#619'
issue: #613
---

## What

chore(tooling): check route-folder types/constants against the artifacts in the folder

Narrowed away from `packages/eslint-local-rules/**` once the approach was
settled: the check lands as a repo-level verify script, so the published rule's
manifest and changelog — claimed by `release-non-blocked-packages` for the first
`@lcabrera/eslint-plugin` publish — are not touched.

## Status / next

- Current step: implemented; discriminator validated over every route-tree file
  (false-positive set empty), gate proven to fire, full quality gate green
- Blockers: none
- Next: PR description, then flip #619 out of draft
