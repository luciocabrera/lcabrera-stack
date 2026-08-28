<!--
  PR title MUST be a Conventional Commit: `type(scope): subject`
  e.g. `feat(ui): add column resize`, `fix(server): guard null rows`.
  Types: feat|fix|chore|docs|test|refactor|perf|ci|build|revert|style.
  Scope: the workspace you touched (ui, server, api, …) or a cross-cutting
  area (ci, docs, tooling, …). commit-convention.mjs is the spec.

  Every section below is required — write "None" rather than deleting a
  heading, so a reviewer can tell "considered, nothing to say" from "skipped".

  The PR Standards CI check (packages/repo-standards/scripts/commit-convention.mjs)
  matches these as HEADINGS, so they MUST keep their plain spelling: numbering,
  emoji or bold in one of the ones it requires fails the gate. Which those are is
  that file's REQUIRED_PR_SECTIONS — read it there rather than from a copy.
  See the `commit-and-pr` skill and docs/agents/workflow.md.
-->

## What

<!-- Exactly what changed: new logic, refactors, deletions, tests, docs. -->

## Why

<!-- The problem this solves. Why this approach, and why the alternatives were
     rejected. How it satisfies the linked issue's acceptance criteria. -->

## Verification

<!-- How correctness was established, not how confident you feel: the quality
     gate, automated tests, manual steps, edge cases, environment, logs. Prefer
     evidence a reader can re-run. If something is unverified, say so here. -->

## Impact Analysis

<!-- What this could break for someone else:
     - Modules / workspaces affected
     - Potential regressions
     - Compatibility (public package surface, config, DB schema)
     - Performance
     - Security / privacy -->

## Test Coverage

<!-- Tests added or updated, and what they pin. "None" plus a reason is a valid
     answer; an untested change that claims tests is not. -->

## Documentation Updates

<!-- Docs changed: inventory row, PATTERNS, ADR, COMMANDS.md, system
     ARCHITECTURE.md only when wiring changed. See the Documentation Update
     Rule in .github/skills/quality-gate-workflow/SKILL.md and ADR-088. -->

## Linked Issues

<!-- `Resolves #123` / `Related to #456`. -->

## Known Limitations

<!-- What this deliberately does not do, and any follow-up filed for it. -->
