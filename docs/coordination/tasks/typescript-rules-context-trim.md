---
id: typescript-rules-context-trim
title: Cut the generic-TypeScript tutorial from the rules file and the derivable rows from the AGENTS.md command table
owner: agent:claude
status: review
branch: docs/501-trim-derivable-agent-instructions
area:
  - .claude/rules/typescript.md
  - AGENTS.md
started: 2026-08-03
updated: 2026-08-03
plan: (none)
pr: #502
issue: #501
---

## What

`.claude/rules/typescript.md` is path-scoped to `**/*.ts`/`**/*.tsx`, so it loads
in nearly every coding session, and 522 of its 741 lines were generic TypeScript
handbook material — `satisfies`, generics, mapped/conditional/template-literal
types, variadic tuples, and a built-in utility-types table. Several of those
examples violated rules stated in the first half of the same file (explicit return
types, `any[]`, mutable non-`readonly` arrays), which is why the file carried a
caveat telling readers not to copy its own examples.

Also drops the eight derivable rows from the AGENTS.md §4 command table; the four
that remain each carry something a reader would get wrong.

Follows #496/#498, which did the same pass over AGENTS.md and did not cover the
rules files.

## Status / next

- Current step: PR #502 open, awaiting review
- Blockers: none
- Next: delete this file when the PR merges
