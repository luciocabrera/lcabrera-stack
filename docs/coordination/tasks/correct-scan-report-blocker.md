---
id: correct-scan-report-blocker
title: Correct what blocks removing packages/scan-report in AGENTS.md
owner: agent:claude
status: active
branch: docs/760-correct-scan-report-blocker
area:
  - AGENTS.md
started: 2026-08-17
updated: 2026-08-17
plan: (none)
pr: #761
issue: #760
---

## What

AGENTS.md §1 says `packages/scan-report` leaves when #682 lands. It does not:
#682 publishes CQMS's ingestion CLI, which is the command `ingest-report.mjs`
forwards to, not the report generators three skills here execute. #716 owns the
decision that would actually move it, and has been amended — it had excluded
those skills on the same false premise.

Claimed by hand rather than with `coordination:claim`: GitHub's user API was
503ing, so the self-assign step could not resolve `@me`.

## Status / next

- Current step: correcting the paragraph
- Blockers: GitHub outage — issue self-assign needs doing when it recovers
- Next: open the PR against #760
