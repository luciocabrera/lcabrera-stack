---
id: claim-protocol-agrees
title: Make the claim protocol and coordination:claim agree
owner: agent:claude
status: review
branch: chore/704-claim-protocol-agrees
area:
  - AGENTS.md
  - docs/coordination/README.md
  - docs/decisions/ADR-074-*
  - docs/decisions/README.md
  - scripts/coordination-claim.sh
started: 2026-08-14
updated: 2026-08-15
plan: (none)
pr: 722
issue: #704
---

## What

Resolve the contradiction in `docs/coordination/README.md` about where a claim
lands: option (b) — the README is corrected to describe the one-branch flow the
tooling implements and #233 built for, with the residual visibility gap stated.

## Status / next

- Current step: review — README rule 2 rewritten, ADR-074 added, AGENTS.md and
  the claim script cross-linked; gate green and PR #722 in review
- Blockers: none — waiting on review, then the merge closes this file
- Next: nothing outstanding

Settled overlap, kept here as the record: `publishing-gate-artifact`
(`fix/715-publishing-gate-artifact`) claimed `docs/decisions/**`, which
`coordination:verify` warned against this task's `docs/decisions/ADR-074-*`.
Coordinated rather than narrowed, because the only file both touched was the
generated index `docs/decisions/README.md` and the ADR numbers (073 there, 074
here) never collided. It landed first as #719; this branch rebased and re-ran
`vp run adr:verify -- --write`, and the register now reports no warning. The
underlying problem — the generated index conflicts between _any_ two concurrent
ADR branches — is #724.
