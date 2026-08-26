# Milestone Naming Scheme

## Purpose

To enforce consistent milestone naming across all lcabreara repositories and planning cycles.

---

## Milestone Pattern

### M1 – Foundation

Bootstrapping, exploration, ADR creation, initial architecture alignment.

### M2 – Abstractions

Extracting reusable utilities, services, and patterns into flagship packages.

### M3 – Cross‑App Integration

Applying abstractions across apps (e.g., apps/showcase, apps/*).

### M4 – Hardening & QA

Tests, validation, performance improvements, DX enhancements.

### M5 – Release Prep

Final polish, documentation, migration guides, release notes.

---

## Rules

- Every issue MUST belong to a milestone.
- If a milestone does not exist:
  - Agents MUST report it.
  - ORCHESTRATOR MUST create an issue to define and register the milestone.
- Milestones MUST NOT be skipped unless explicitly justified in an ADR.

---

## Example

```yaml
milestone: 'M2 - Abstractions'
```
