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
  (`fix(ui): …`), since the pull request that closes it must use that format
  anyway.

  Fill every section. "None" is a valid answer and tells the next reader you
  considered it; a deleted heading does not. The Issue Standards check matches
  these as headings, and numbering is optional — `## Problem Statement` passes
  as well as `## 1. Problem Statement`.
-->

## 1. Problem Statement

<!-- What is wrong or missing today, and what it costs. Not the fix. -->

## 2. Objective / Desired Outcome

<!-- The state this reaches. Written so someone else could tell whether it was
     reached without asking you. -->

## 3. Context & Background

<!-- What a reader needs in order to act without re-deriving it: prior work,
     the constraint that rules out the obvious approach, the decision record
     this follows from. -->

## 4. Reproduction Steps

<!-- For a bug: the steps, and the preconditions they depend on (branch, config
     state, whether a fix has landed). "Not a bug." is a valid answer. -->

## 5. Scope Definition

### In Scope

<!-- What this issue covers. -->

### Out of Scope

<!-- What it deliberately does not, so the boundary is a decision rather than an
     omission. -->

## 6. Acceptance Criteria

<!-- Checkboxes, each one something a reader could verify. -->

- [ ]
- [ ]

## 7. Implementation Notes

<!-- Traps, prior attempts, the approach that looks right and is not. "None." -->

## 8. Related Work

<!-- Issues, pull requests, decision records. "None." -->

## 9. Planning Metadata

```yaml
dependencies:
  blocking: []
  blockedBy: []
  parent: null
  children: []
```
