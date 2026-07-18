---
branch: chore/biome-linter-hardening
base: main
target: main
integrator: human:lucio
status: active
updated: 2026-07-18
---

## What

This branch hosts the repo's **deterministic-quality hardening** effort, worked by
two agents at once because the changes are adjacent (all touch the lint/quality
gate surface) and land more cleanly stacked than as racing independent branches:

- **Biome hardening** (agent:other) — phased ratchets in `biome.jsonc` beyond
  `recommended`, per `~/.claude/plans/let-s-improve-our-deterministic-flickering-gadget.md`
  and ADR-035.
- **SonarCloud reporting** (agent:claude) — `sonar:report` / `sonar:verify` tooling
  - `reports/sonar/`, per [tasks/sonar-reporting.md](../tasks/sonar-reporting.md).

The two share no source files; the descriptor exists to record that the branch is
a collaboration surface (so same-branch work isn't read as a collision) and to
name the one integrator.

## Within-branch protocol

- Each participant owns a distinct `area` (see the sub-area map). Coordinate before
  touching a file outside yours — in particular `biome.jsonc` (Biome work) and
  `scripts/sonar-report.mjs` + `reports/sonar/**` (Sonar work).
- Shared docs (`AGENTS.md`, `COMMANDS.md`) are edited in **different sections** —
  the Biome work touches the §4 Biome paragraph; the Sonar work adds a separate
  Sonar paragraph + COMMANDS rows. Keep edits region-local so they never conflict.
- **Pull/rebase before every push; push small and often.**
- The **integrator** (human:lucio) owns rebasing onto `main` and the final merge.

## Sub-area map

- `agent:other` → `biome.jsonc`, `docs/cqms/decisions/ADR-035*`, AGENTS.md §4 Biome paragraph — Biome rule hardening
- `agent:claude` → `scripts/sonar-report.mjs`, `reports/sonar/**` — SonarCloud reporting tooling
