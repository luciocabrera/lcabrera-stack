---
id: health-swarm-adr-links
title: Repair the ADR cross-refs left one level too shallow by the tier split
owner: agent:claude
status: review
branch: docs/515-repair-adr-cross-refs
area:
  - docs/decisions/ADR-014-path-field-and-form-cancel-ux.md
  - docs/decisions/ADR-035-biome-third-linter.md
  - docs/decisions/ADR-044-decline-pnpm-global-virtual-store.md
started: 2026-08-04
updated: 2026-08-04
plan: (none)
pr: (none)
issue: https://github.com/luciocabrera/vite-react-compiler/issues/515
---

## What

Re-bases the four relative links that commit 73ddfe51 left one level too
shallow when it moved 20 ADRs from docs/cqms/decisions/ to docs/decisions/.

## Status / next

- Current step: quality gate
- Blockers: none
- Next: open PR against main
