# Dependency Convention Specification

## Purpose

To standardize how issues relate to each other across the lcabreara ecosystem, enabling predictable planning, parallelization, and automated orchestration.

---

## Core Relationship Types

### Blocking

Indicates that this issue prevents another issue from being completed.

- **Meaning:** This issue must be finished before the other can start or finish.
- **Example:**  
  Issue A **blocks** Issue B → B cannot proceed until A is done.

### Blocked By

The inverse of _Blocking_.

- **Meaning:** This issue is waiting for another issue.
- **Example:**  
  Issue B is **blocked by** Issue A → B is on hold.

### Parent

A high‑level issue representing a broader initiative or epic.

- **Meaning:** This issue contains multiple child issues.
- **Rules:**
  - Parent issues **must not** contain implementation work.
  - Parent issues **must** track progress via child issues.

### Child

A concrete, actionable issue that contributes to a parent.

- **Meaning:** This issue is part of a larger initiative.
- **Rules:**
  - Child issues **must** have acceptance criteria.
  - Child issues **must** reference their parent.

---

## Required Fields in Every Issue

Every GitHub issue **must** include, under its `## 9. Planning Metadata` heading:

```yaml
dependencies:
  blocking: [issue-ids]
  blockedBy: [issue-ids]
  parent: issue-id | null
  children: [issue-ids]
```

**This is enforced, not advisory.** `validateIssueBody` in
[`scripts/lib/commit-convention.mjs`](../../scripts/lib/commit-convention.mjs)
checks for the heading, the `dependencies:` block and all four keys;
[`issue-standards.yml`](../../.github/workflows/issue-standards.yml) runs it when
an issue is opened or edited. It was unenforceable and unfilled before that
(#409): the rule said "must" while
[the template](../../.github/ISSUE_TEMPLATE/standard_issue.md) offered no such
section and nothing read one.

**All four keys are required; empty is a valid value.** A standalone issue writes
`blocking: []`, `blockedBy: []`, `parent: null`, `children: []` — that is the
answer, not an omission, and it distinguishes "considered, none" from "never
looked". Only the keys are checked, so the values stay a convention: use issue
numbers (`#123`).

```yaml
dependencies:
  blocking:
    - issue-123
  blockedBy:
    - issue-98
  parent: issue-200
  children:
    - issue-201
    - issue-202
```
