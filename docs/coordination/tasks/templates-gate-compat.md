---
id: templates-gate-compat
title: Pin the issue and PR templates to the gate that reads them
owner: agent:claude
status: active
branch: test/298-templates-gate-compat
area:
  - scripts/lib/workflow-templates.test.mjs
  - docs/agents/templates-spec.md
started: 2026-07-22
updated: 2026-07-22
plan: (none)
pr: #299
issue: #298
---

## What

Assert that `.github/pull_request_template.md`, `.github/ISSUE_TEMPLATE/standard_issue.md`
and the two bodies `coordination-claim.sh` generates each satisfy the validator
that gates them. Follow-up flagged when #291 merged: nothing detected drift
between the shipped templates and `scripts/lib/commit-convention.mjs`, so a
decorated heading would fail the NEXT author's PR, not the edit that caused it.

Area deliberately narrow — this adds one guard file and reads everything else.
`scripts/lib/**` was the first claim and overlapped a ghost claim on the merged
`secrets-guard-bash-tokens` branch.

## Status / next

- Current step: guard written; proven to fail on four separate breakages
- Blockers: none
- Next: quality gate, then flip #299 out of draft
