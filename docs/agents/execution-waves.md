# Execution Wave Definitions

## Purpose

Execution waves define parallelization groups for multi‑agent planning and implementation.  
Every issue MUST belong to exactly one wave.

---

## Wave Definitions

### Wave 1 — Exploration & ADRs

- Codebase exploration
- Standards review
- ADR creation
- Identification of reusable patterns
- Discovery of governance gaps

### Wave 2 — Foundational Refactors

- Implementing ADR decisions
- Creating new abstractions
- Refactoring flagship packages
- Introducing new utilities/services

### Wave 3 — Cross‑App Improvements

- Applying abstractions across apps
- Removing duplication
- Aligning apps/react-router with flagship packages

### Wave 4 — Hardening & QA

- Tests
- Performance improvements
- DX enhancements
- Error handling and resilience

### Wave 5 — Final Integration

- Documentation
- Migration guides
- Release preparation
- Final polish

---

## Rules

- Every issue MUST specify its execution wave.
- If wave definitions need refinement:
  - Agents MUST report the gap.
  - ORCHESTRATOR MUST create an issue to update the wave definitions.

---

## Example

```yaml
executionWave: 'Wave 3 - Cross-App Improvements'
```
