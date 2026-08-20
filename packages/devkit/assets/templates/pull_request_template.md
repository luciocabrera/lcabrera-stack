<!--
  PR title MUST be a Conventional Commit: `type(scope): subject`
  e.g. `feat(ui): add column resize`, `fix(api): guard null rows`.
  The type vocabulary is the gate runtime's, and the same one branches and
  commits use — the gate names the allowed types when it rejects one.

  Every section below is required — write "None" rather than deleting a
  heading, so a reviewer can tell "considered, nothing to say" from "skipped".

  The headings are matched as headings, not as substrings, and MUST keep their
  plain spelling: numbering, emoji or bold in one of them fails the PR Standards
  check.
-->

## What

<!-- Exactly what changed: new logic, refactors, deletions, tests, docs. -->

## Why

<!-- The problem this solves. Why this approach, and why the alternatives were
     rejected. How it satisfies the linked issue's acceptance criteria. -->

## Verification

<!-- How correctness was established, not how confident you feel: the gate,
     automated tests, manual steps, edge cases, environment, logs. Prefer
     evidence a reader can re-run, and state the preconditions it depends on.
     If something is unverified, say so here. -->

## Impact Analysis

<!-- What this could break for someone else:
     - Modules / workspaces affected
     - Potential regressions
     - Compatibility (published surface, config, schema)
     - Performance
     - Security / privacy -->

## Test Coverage

<!-- Tests added or updated, and what they pin. "None" plus a reason is a valid
     answer; an untested change that claims tests is not. -->

## Documentation Updates

<!-- Docs changed, and the ones deliberately left alone. -->

## Linked Issues

<!-- `Resolves #123` / `Related to #456`. -->

## Known Limitations

<!-- What this deliberately does not do, and any follow-up filed for it. -->
