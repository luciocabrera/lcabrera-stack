---
name: Standard issue
about: The required structure for every issue — bug, task or request
title: ''
labels: ''
assignees: ''
---

<!--
  Title: short and action-oriented, e.g. "Fix incorrect pagination logic in
  DataFetcher". Prefer a Conventional-Commit prefix when the work maps to one
  (`fix(ui): …`), since the PR that closes it must use that format anyway.

  Fill every section. "None" is a valid answer and tells the next agent you
  considered it; a deleted heading does not.

  Tracking issues opened by `vp run coordination:claim --new-issue` are exempt:
  they are a link between a task file and the board, and the task file carries
  the detail. See docs/agents/workflow.md.
-->

## 1. Problem Statement

<!-- What is happening, or what is needed. Why it matters. Which
     workspace/module/agent is affected. -->

## 2. Objective / Desired Outcome

<!-- What must be true once this is resolved. The expected behaviour or output. -->

## 3. Context & Background

<!-- Architecture notes, previous attempts, related issues/PRs, dependencies,
     constraints. Link the ADR if one governs this area. -->

## 4. Reproduction Steps

<!-- MANDATORY for bugs; write "Not a bug" otherwise.
     1. Steps
     2. Input / environment
     3. Expected result
     4. Actual result
     5. Logs, traces, screenshots -->

## 5. Scope Definition

### In Scope

<!-- Explicit list. -->

### Out of Scope

<!-- Explicit list. This is what stops a follow-up being read as a regression. -->

## 6. Acceptance Criteria

<!-- Binary and testable. Replace these with the real conditions. -->

- [ ] Expected behaviour implemented
- [ ] No regressions
- [ ] Automated tests added or updated
- [ ] Documentation updated
- [ ] Approach consistent with repository conventions

## 7. Implementation Notes

<!-- Optional guidance for whoever picks this up. -->

## 8. Related Work

<!-- Issues, PRs, ADRs, docs. -->

## 9. Planning Metadata

<!-- The relationships this issue has, per docs/agents/dependency-conventions.md.
     Keep the block even when nothing relates: empty lists and `parent: null` are
     the answer for a standalone issue, and they say "considered" where a deleted
     block says nothing. Use issue numbers (`#123`). -->

```yaml
dependencies:
  blocking: []
  blockedBy: []
  parent: null
  children: []
```
