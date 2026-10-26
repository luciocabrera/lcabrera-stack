---
id: shipped-harness-conformance
title: Run harness conformance over the artifacts devkit ships
owner: agent:claude
status: review
branch: feat/1504-shipped-harness-conformance
area:
  - packages/repo-standards/scripts/conformance-*
  - packages/repo-standards/scripts/verify-harness-conformance*
  - packages/repo-standards/scripts/config*
  - scripts/lib/validate-skills-contract.cjs
  - devkit.config.json
  - docs/product/requirements/a-skill-i-am-handed-completes-its-task.md
  - docs/product/requirements/an-agent-works-my-repository-without-this-ones-history.md
  - .changeset/shipped-harness-conformance.md
  - packages/repo-standards/README.md
  - reports/api-surface/repo-standards.txt
  - scripts/generate-skills-compliance-report.cjs
  - scripts/verify-harness-conformance.test.mjs
  - package.json
  - COMMANDS.md
  - .github/workflows/check-safe.yml
  - packages/devkit/CLASSIFICATION.md
started: 2026-10-26
updated: 2026-10-26
plan: (none)
pr: #1511
issue: #1504
---

## What

Run harness conformance over the artifacts devkit ships

## Status / next

- Current step: built, gate run, PR open
- Blockers: none
- Next:
