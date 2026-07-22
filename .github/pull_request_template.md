<!--
  PR title MUST be a Conventional Commit: `type(scope): subject`
  e.g. `feat(ui): add column resize`, `fix(api-server): guard null rows`.
  Types: feat|fix|chore|docs|test|refactor|perf|ci|build|revert|style.
  Scope: the workspace you touched (ui, admin_system, api-server, …) or a
  cross-cutting area (ci, docs, tooling, …).

  Every section below is required — write "None" rather than deleting a
  heading, so a reviewer can tell "considered, nothing to say" from "skipped".

  `## What` and `## Verification` are matched by the PR Standards CI check
  (scripts/lib/commit-convention.mjs) and MUST keep those exact spellings —
  no numbering, emoji or bold in those two headings, or the gate fails.
  See the `commit-and-pr` skill and docs/agent_workflow.md.
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

<!-- Docs changed: ARCHITECTURE.md, INVENTORY.md, PATTERNS.md, ADRs, COMMANDS.md.
     See the Documentation Update Rule in AGENTS.md. -->

## Linked Issues

<!-- `Resolves #123` / `Related to #456`. -->

## Known Limitations

<!-- What this deliberately does not do, and any follow-up filed for it. -->
