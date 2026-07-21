---
id: secret-scan-ci
title: Scan repository content for secrets, not just the agent boundary
owner: agent:claude
status: active
branch: feat/secret-scan-ci
area:
  - .github/workflows/secret-scan.yml
  - .gitleaks.toml
started: 2026-07-21
updated: 2026-07-21
plan: (none)
pr: (none)
issue: #218
---

## What

Both existing guards sit at the agent boundary; neither looks at what lands in a
commit, and the repository is public. Adds a content scan on PRs and pushes to
`main` — tree plus the PR's own commit range.

This is layer 2 of 2. Layer 1 is GitHub's own secret scanning with push
protection, which is free for public repos and blocks server-side; it is a
repository setting and needs the owner (see #218, #168).

## Status / next

- Current step: baseline measured (2 findings, both false positives — one fixed
  in source, one allowlisted); history audited clean over 1414 commits; workflow
  and config written and verified locally.
- Blockers: none for layer 2. Layer 1 needs a repo-admin toggle.
- Next: PR.
