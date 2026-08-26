# ADR-090 — Gate the no-mid-stream-exit rule, by parsing

**Status:** Accepted

**Date:** 2026-08-25
**Issue:** [#929](https://github.com/luciocabrera/lcabrera-stack/issues/929)
**Relates to:** [ADR-055](./ADR-055-react-doctor-as-a-gate.md)

## Context

`.claude/rules/scripts.md` requires a top-level try/catch and `process.exitCode`,
and forbids `process.exit()` mid-stream. Writes to stderr are asynchronous when
it is a pipe, so exiting can drop the buffered message that explains the
failure — under CI and `tee` exactly, which is when a gate's output matters
most.

The rule existed only as prose. Eleven scripts broke it, and #928 wrote the same
defect into a brand-new guard where only a reviewer caught it. A rule nothing
checks is broken as easily in new files as in old ones.

## Decision

Enforce it with a repo-wide gate, `vp run scripts:exits:verify`, which **parses**
each `.mjs`/`.cjs` and reports `process.exit` call expressions.

## Why not an eslint rule

This is lint-shaped work, and `packages/eslint-local-rules` exists for it. It
cannot reach these files: the eslint fan-out is per-workspace and **root
`scripts/` is not a workspace**, which is where most of the offenders live. The
per-file size gate is a standalone repo-wide script for the same reason.

## Why parse rather than grep

A regex fails the file that _documents_ the rule.
`scripts/verify-package-manager-pin.mjs` carries `process.exit()` in a comment
explaining why it does not call it, and a gate that cannot tell a comment from a
call punishes the most careful file in the repo. Parsing also distinguishes
`process.exitCode`, which is the form the rule asks for.

## Why not in `@lcabrera/repo-standards`

That package ships the sibling size gate and would be the natural home if this
should reach other repositories. Adding a public bin pulls in a changeset, the
API-surface gate and the packed-tarball bin gate — heavy for a rule that is
currently repo-local. Revisit when another repository wants it.

## Consequences

- A new `process.exit()` fails the gate rather than depending on review.
- Three offenders could not simply return: their callers treat a missing result
  as a legitimate state, so returning would convert a hard failure into a
  report. Those throw, and a top-level handler owns the status.
- The gate covers only the `process.exit()` half of the rule. That a top-level
  try/catch exists, and that a verify script lists every discrepancy rather than
  the first, remain prose.
- `.github/skills/**` and `apps/react-router/scripts/**` are now covered by a
  root gate with no per-workspace override; the skip list is where an exception
  would be stated.
