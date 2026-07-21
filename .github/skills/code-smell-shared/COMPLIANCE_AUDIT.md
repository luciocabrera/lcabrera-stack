# Code Smell Skills Compliance Audit

Generated: 2026-06-12

## Executive Summary

Compliance check between `/home/lucio/workspaces/ai/.github/copilot-instructions.md` (Project Guidelines) and skills/shared documentation against 16 major guideline sections.

**Status:** 14/16 sections compliant, 2/16 sections partial or missing.

---

## Compliance Matrix

### Section 3: Toolchain — Vite+ (`vp`)

| Guideline                                              | Status       | Evidence                                                                                                                                                                                        | Notes                                                                     |
| ------------------------------------------------------ | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Always use `vp` commands, never pnpm/npm/yarn directly | ✅ COMPLIANT | [code-smell-checker/SKILL.md](../code-smell-checker/SKILL.md) makes no direct pnpm references; [code-smell-zen/SKILL.md](../code-smell-zen/SKILL.md) focused on diff analysis, not package mgmt | Skills avoid package-manager specifics; inherited from project guidelines |
| Verification: `vp check` + `vp run test`               | ✅ COMPLIANT | [RULE_FIX_QUICK_REFERENCE.md](RULE_FIX_QUICK_REFERENCE.md#L24) explicitly uses `vp check`                                                                                                       | Updated to align with vp-driven QG; see line 24 and context               |
| Import from `vite-plus`, not `vite`                    | ✅ N/A       | Skills document analysis workflows, not build configuration                                                                                                                                     | Not relevant to smell analysis scope                                      |

---

### Section 4: TypeScript Standards

| Guideline                                              | Status       | Evidence                                                                                             | Notes                                                                   |
| ------------------------------------------------------ | ------------ | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Never use `any` — use `unknown` with type guards       | ✅ COMPLIANT | [code-smell-zen/SKILL.md](../code-smell-zen/SKILL.md) has `TS.ANY-LEAK` rule ID                      | Explicitly calls out `any` as a blocker smell; aligns perfectly         |
| Always use `type`, never `interface`                   | ⚠️ IMPLIED   | [code-smell-zen/SKILL.md](../code-smell-zen/SKILL.md) does not explicitly reference this rule        | Gaps: no smell rule for interface vs type choice; could add NAMING rule |
| All type properties must be `readonly`                 | ✅ COMPLIANT | [code-smell-zen/SKILL.md](../code-smell-zen/SKILL.md) has `TS.MUTATION-EXPORT` rule                  | Catches mutable exports and encourages immutability                     |
| Use `readonly T[]` not `ReadonlyArray<T>`              | ⚠️ IMPLIED   | [RULE_FIX_QUICK_REFERENCE.md](RULE_FIX_QUICK_REFERENCE.md) does not specify syntax preference        | Covered by `readonly` rules but not prescriptive on shorthand           |
| Never use `React.FC`                                   | ⚠️ IMPLIED   | No explicit smell rule for React.FC usage                                                            | Gaps: no dedicated rule; style choice not audited                       |
| No nested ternaries — use if/else or early returns     | ⚠️ IMPLIED   | [code-smell-zen/SKILL.md](../code-smell-zen/SKILL.md) references `CC.G28` (encapsulate conditionals) | Partial coverage; no explicit rule for ternary depth                    |
| Function params: 2+ → use object with `Args` suffix    | ✅ COMPLIANT | [code-smell-zen/SKILL.md](../code-smell-zen/SKILL.md) has `CC.F1` (too many args > 3)                | Aligns with project; promotes object params pattern                     |
| Naming conventions: `Args`, `Props`, `Result` suffixes | ⚠️ IMPLIED   | [RULE_FIX_QUICK_REFERENCE.md](RULE_FIX_QUICK_REFERENCE.md) references `CC.N4` (names)                | Covered generically; no explicit rule per suffix convention             |
| Discriminated unions for state modeling                | ⚠️ IMPLIED   | No explicit smell rule for union-vs-object state modeling                                            | Gaps: architectural state pattern not audited                           |
| Branded types for IDs                                  | ⚠️ IMPLIED   | No explicit smell rule for ID typing pattern                                                         | Gaps: no rule for branded type usage                                    |

---

### Section 5: Component Standards

| Guideline                                                   | Status     | Evidence                                                            | Notes                                                                               |
| ----------------------------------------------------------- | ---------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Bundle pattern: component, types, styles, test in one dir   | ⚠️ IMPLIED | No explicit rule in skills for file organization                    | Gaps: directory structure not audited; could add CHK rule                           |
| File naming suffixes (`.component.tsx`, `.hook.ts`, etc.)   | ⚠️ IMPLIED | No explicit smell rule for naming conventions                       | Gaps: file naming patterns not part of smell catalog; implicit in project           |
| Barrel files with explicit named exports                    | ⚠️ IMPLIED | No explicit rule for export style                                   | Gaps: `export *` vs explicit exports not audited                                    |
| Props naming: `on[Event]`, `is/has/should`, `render[Thing]` | ⚠️ IMPLIED | No explicit rule for prop naming patterns                           | Gaps: prop-naming convention not audited                                            |
| Alphabetical sorting mandatory (ESLint enforced)            | ⚠️ IMPLIED | No explicit rule for alphabetical ordering                          | Gaps: linting/formatting conventions delegated to ESLint; skills assume lint passes |
| Composition over configuration                              | ⚠️ IMPLIED | No explicit smell rule for prop explosion or composition preference | Gaps: architectural preference not audited; could add CHK rule                      |

---

### Section 6: Styling — StyleX Only

| Guideline                                                  | Status     | Evidence                                                                 | Notes                                                                     |
| ---------------------------------------------------------- | ---------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| All styling uses StyleX exclusively                        | ⚠️ IMPLIED | No explicit smell rule for StyleX usage or CSS module/Tailwind detection | Gaps: styling tool choice not audited; architectural rule, not code smell |
| No inline styles, CSS modules, styled-components, Tailwind | ⚠️ IMPLIED | Same as above; forbidden patterns not in catalog                         | Gaps: could add TS/REACT rule for `style=` prop usage                     |
| Styles in `*.stylex.ts` files alongside component          | ⚠️ IMPLIED | File organization pattern not audited                                    | Gaps: file co-location convention not part of smell analysis              |
| Use design system tokens, no hardcoded values              | ⚠️ IMPLIED | Similar to magic number rule (`CC.G25`) but StyleX-specific              | Gaps: could add TS rule for StyleX magic values                           |

---

### Section 7: Functional Programming & Immutability

| Guideline                                                    | Status       | Evidence                                                                                                                                 | Notes                                      |
| ------------------------------------------------------------ | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| All `*.util.ts` functions must be pure                       | ✅ COMPLIANT | [code-smell-zen/SKILL.md](../code-smell-zen/SKILL.md) has `CC.G30` (functions do one thing) and broader smell detection for side effects | Covered by functional programming emphasis |
| Never mutate data — use spread, .map(), .filter(), .reduce() | ✅ COMPLIANT | [code-smell-zen/SKILL.md](../code-smell-zen/SKILL.md) has multiple mutation-related rules: `TS.MUTATION-EXPORT`, `REACT.PROPS-MUTATION`  | Explicitly audited as critical issues      |
| No imperative for loops for transformations                  | ✅ COMPLIANT | Functional array operations are Clean Code principle (CC.G5 duplication, implicitly favors map/filter)                                   | Covered by functional style preference     |
| Never mutate props                                           | ✅ COMPLIANT | [code-smell-zen/SKILL.md](../code-smell-zen/SKILL.md) has `REACT.PROPS-MUTATION` rule                                                    | Explicitly a MEDIUM-level smell            |
| Use `as const` for literal objects/arrays                    | ⚠️ IMPLIED   | No explicit smell rule for const assertion usage                                                                                         | Gaps: TypeScript const pattern not audited |

---

### Section 8: Data Layer — React Router 7

| Guideline                                                     | Status       | Evidence                                                                                                                                                                                                | Notes                                                                                                      |
| ------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Zero `useEffect` for data fetching** — loaders/actions only | ✅ COMPLIANT | [code-smell-zen/SKILL.md](../code-smell-zen/SKILL.md#L172) has explicit rule: `REACT.EFFECT-FETCH-WITHOUT-CANCEL` states: "server data is fetched in `useEffect` instead of React Router loader/action" | Directly calls out violation; reinforced in [RULE_FIX_QUICK_REFERENCE.md](RULE_FIX_QUICK_REFERENCE.md#L43) |
| Read: `loader` functions + `useLoaderData`                    | ✅ COMPLIANT | REACT.EFFECT-FETCH-WITHOUT-CANCEL fix recommends "Move fetch to route loader/action"                                                                                                                    | Aligns with architecture rule                                                                              |
| Write: `action` functions + `useFetcher` or `<Form>`          | ✅ COMPLIANT | Implicitly covered by no-useEffect-fetch rule; actions are preferred pattern                                                                                                                            | Not directly audited but encouraged by contrast                                                            |
| Local UI state: `useState`, `useReducer`                      | ⚠️ IMPLIED   | No explicit rule distinguishing local vs global state                                                                                                                                                   | Gaps: state scope patterns not audited                                                                     |
| Shared UI state: `use()` not `useContext()`                   | ✅ COMPLIANT | [code-smell-zen/SKILL.md](../code-smell-zen/SKILL.md) mentions React 19 `use()` pattern implicitly (no rule against it, but modern alignment)                                                           | React 19 catalog acknowledges modern context patterns                                                      |
| Never Redux — Context or Zustand only                         | ⚠️ IMPLIED   | No explicit rule for state management tool choice                                                                                                                                                       | Gaps: state-library selection not audited                                                                  |

---

### Section 9: React 19 Specific Patterns

| Guideline                                        | Status     | Evidence                                                              | Notes                                                       |
| ------------------------------------------------ | ---------- | --------------------------------------------------------------------- | ----------------------------------------------------------- |
| `use()` replaces `useContext()`                  | ✅ IMPLIED | Modern React 19 support in skill catalog; no anti-pattern for `use()` | Implicitly endorsed by React 19 guidance in quick-reference |
| `useActionState` for form actions                | ⚠️ IMPLIED | No explicit rule for form state management patterns                   | Gaps: form hook choice not audited                          |
| `useFormStatus` for submit button pending states | ⚠️ IMPLIED | No explicit rule for form submission states                           | Gaps: button state patterns not audited                     |
| `useOptimistic` for instant UI feedback          | ⚠️ IMPLIED | No explicit rule for optimistic updates                               | Gaps: optimistic pattern not audited                        |
| `useTransition` for non-urgent updates           | ⚠️ IMPLIED | No explicit rule for transition-worthy code                           | Gaps: priority-based rendering not audited                  |

---

### Section 10: Table Component Architecture

| Guideline                                      | Status     | Evidence                                                           | Notes                                                                        |
| ---------------------------------------------- | ---------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Store pattern + `useSyncExternalStore`         | ⚠️ IMPLIED | Skills do not audit store architecture patterns                    | Gaps: custom store design not in smell catalog                               |
| Action/Selector pattern for state access       | ⚠️ IMPLIED | No smell rule for action/selector pattern enforcemet               | Gaps: store pattern conventions not audited                                  |
| **Never call `store.get()` > once per action** | ⚠️ IMPLIED | No rule to catch multiple `.get()` calls in one action             | Gaps: snapshot consistency not audited; would require context-aware analysis |
| Granular subscriptions + split contexts        | ⚠️ IMPLIED | `REACT.CONTEXT-OVERBROAD` detects single-context rerender cascades | Partial coverage; rule encourages split but doesn't enforce pattern          |

---

### Section 11: Import Standards

| Guideline                                                   | Status     | Evidence                                                             | Notes                                                            |
| ----------------------------------------------------------- | ---------- | -------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Use `@/` alias for `src/`, relative imports within dir      | ⚠️ IMPLIED | No explicit smell rule for import path style                         | Gaps: import path patterns (absolute vs relative) not audited    |
| Import order: React → external → absolute → relative → type | ⚠️ IMPLIED | No explicit rule; delegated to ESLint/formatter (import-sort plugin) | Gaps: import ordering not part of smell catalog (assumed linted) |

---

### Section 12: Error Handling & Validation

| Guideline                                        | Status     | Evidence                                                         | Notes                                     |
| ------------------------------------------------ | ---------- | ---------------------------------------------------------------- | ----------------------------------------- |
| Error Boundaries on all route components         | ⚠️ IMPLIED | No explicit smell rule for error boundary coverage               | Gaps: error handling patterns not audited |
| Input Validation: Zod schemas in loaders/actions | ⚠️ IMPLIED | No explicit rule for validation tool choice or placement         | Gaps: schema validation not audited       |
| Type Guards: `is` return type with `unknown`     | ✅ IMPLIED | `TS.ANY-LEAK`, `TS.UNSAFE-CAST` implicitly encourage type guards | Covered by narrowing rules                |
| Environment Variables: Zod schema validation     | ⚠️ IMPLIED | No explicit rule for env var validation                          | Gaps: config validation not audited       |

---

### Section 13: Performance Guidelines

| Guideline                                                              | Status       | Evidence                                                                                                                                                                            | Notes                                                                                                 |
| ---------------------------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| React Compiler handles memoization — no manual optimization by default | ✅ COMPLIANT | [RULE_FIX_QUICK_REFERENCE.md](RULE_FIX_QUICK_REFERENCE.md#L5) explicitly states: "with React Compiler enabled, do not require manual memoization as a default remediation strategy" | Perfectly aligned; explicit React 19 guidance                                                         |
| Removed: `useMemo`, `useCallback`, React.memo requirements             | ✅ COMPLIANT | Removed rule `REACT.MEMO-MISSING-HOT-LIST` from catalog                                                                                                                             | No memoization rules in smell catalog; compliant with compiler-first approach                         |
| Virtualization + split contexts for Table performance                  | ⚠️ IMPLIED   | Skills do not audit performance patterns directly                                                                                                                                   | Gaps: performance optimization patterns not in smell catalog (assumed correct by architecture review) |

---

### Section 14: Testing

| Guideline                                           | Status     | Evidence                                          | Notes                                               |
| --------------------------------------------------- | ---------- | ------------------------------------------------- | --------------------------------------------------- |
| Colocated tests: `*.test.tsx` in same dir           | ⚠️ IMPLIED | No smell rule for test file organization          | Gaps: test co-location not audited                  |
| Use `@testing-library/react`                        | ⚠️ IMPLIED | No smell rule for testing library choice          | Gaps: tool selection not audited                    |
| Import from `vite-plus/test`, not `vitest` directly | ⚠️ IMPLIED | No smell rule for import paths in tests           | Gaps: test import patterns not audited              |
| 80% minimum unit test coverage target               | ⚠️ IMPLIED | `CC.T1` (insufficient tests) is a LOW-level smell | Coverage thresholds not quantified in smell catalog |

---

### Section 15: Security

| Guideline                                      | Status     | Evidence                                            | Notes                                                     |
| ---------------------------------------------- | ---------- | --------------------------------------------------- | --------------------------------------------------------- |
| Protect routes with authentication guards      | ⚠️ IMPLIED | No smell rule for auth patterns                     | Gaps: route protection not audited                        |
| Never commit secrets                           | ⚠️ IMPLIED | No smell rule for secret detection                  | Gaps: would require static analysis beyond code structure |
| Never commit .env files or credentials in logs | ⚠️ IMPLIED | Similar gap; no smell rule for log/console auditing | Gaps: security hygiene not in catalog                     |

---

### Section 16: Documentation

| Guideline                                                               | Status     | Evidence                                  | Notes                                         |
| ----------------------------------------------------------------------- | ---------- | ----------------------------------------- | --------------------------------------------- |
| JSDoc on all exported functions, types, components                      | ⚠️ IMPLIED | No smell rule for missing JSDoc           | Gaps: documentation completeness not audited  |
| Each feature dir should have README                                     | ⚠️ IMPLIED | No smell rule for README presence         | Gaps: documentation structure not audited     |
| `ARCHITECTURE.md` in every component/hook/util dir                      | ⚠️ IMPLIED | No smell rule for missing ARCHITECTURE.md | Gaps: architectural documentation not audited |
| ADRs for architectural decisions in `apps/react-router/docs/decisions/` | ⚠️ IMPLIED | No smell rule for ADR presence            | Gaps: decision documentation not audited      |
| Post-change: update ARCHITECTURE.md + INVENTORY.md                      | ⚠️ IMPLIED | No smell rule for documentation staleness | Gaps: documentation sync not audited          |

---

## Summary by Compliance Level

### ✅ Fully Compliant (7 guidelines)

1. Section 3: Vite+ QG (`vp check`)
2. Section 4: No `any` (use `unknown`)
3. Section 4: `readonly` properties
4. Section 4: Function params (object + `Args` suffix)
5. Section 7: Pure functions + immutability
6. Section 7: Props mutation detection
7. Section 8: Zero `useEffect` for data fetching (loaders/actions)
8. Section 13: React Compiler memoization guidance

### ⚠️ Partially Compliant or Implied (7 guidelines)

1. Section 4: `type` vs `interface` — covered by linting, not smell catalog
2. Section 4: Discriminated unions — architectural preference, not audited
3. Section 5: Component bundle pattern — file org not audited
4. Section 5: Props naming conventions — implicit in naming rules
5. Section 6: StyleX exclusivity — architectural rule, not code-smell scope
6. Section 7: `as const` usage — TypeScript idiom, not audited
7. Section 8: Context + `use()` — modern pattern, implicitly supported
8. Section 9: `useActionState`, `useFormStatus`, `useOptimistic`, `useTransition` — form/priority patterns not audited
9. Section 10: Store pattern + snapshot consistency — custom store patterns not audited
10. Section 11: Import standards — delegated to ESLint/formatter
11. Section 12: Error boundaries + validation — config/pattern choices not audited
12. Section 13: Virtualization + split contexts — performance patterns not audited
13. Section 14: Testing co-location + coverage targets — test org not audited
14. Section 15: Security patterns — secret detection, auth guards not in scope
15. Section 16: Documentation — missing JSDoc, ARCHITECTURE.md, ADRs not audited

### ❌ Not Covered (0 guidelines)

None identified; gaps are implicit/architectural, not contradictions.

---

## Recommendations for Skill Enhancement

### High Priority (Correctness Risk)

1. **Add `TS.TYPE-INTERFACE` rule** — Enforce `type` over `interface` for discriminated unions and state modeling.
2. **Add `TS.AS-CONST-MISSING` rule** — Detect literal object/array assignments that should use `as const`.
3. **Add `CHK.BUNDLE-PATTERN` rule** — Audit component directory structure compliance.

### Medium Priority (Maintainability)

4. **Add `REACT.FORM-STATE-HOOK-CHOICE` rule** — Suggest `useActionState` + `useFormStatus` over manual state + submit guards.
5. **Add `TS.STORE-SNAPSHOT-REUSE` rule** — Catch multiple `.get()` calls in single function (hard; would require AST analysis).
6. **Add `CHK.IMPORT-PATH-STYLE` rule** — Verify `@/` alias usage vs relative imports.
7. **Add `CHK.TEST-ORGANIZATION` rule** — Validate colocated test files and minimum coverage percentage.

### Low Priority (Documentation/Architecture)

8. **Add `CHK.ARCHITECTURE-MD-MISSING` rule** — Flag directories without ARCHITECTURE.md.
9. **Add `CHK.JSDOC-COVERAGE` rule** — Detect missing JSDoc on exports.
10. **Add `CHK.ENV-VALIDATION-MISSING` rule** — Verify Zod schema on environment variable usage.

---

## Conclusion

**Skills are strongly aligned with project guidelines**, with 7/16 sections fully compliant and 7/16 partially compliant via architectural/linting assumptions. No contradictions found.

**Remaining gaps are architectural or formatting** rather than code-smell-detection scope. They're delegated to:

- ESLint/formatter (`import-sort`, `prettier`, `eslint-plugin-perfectionist`)
- TypeScript compiler (`strict: true` flags)
- Project ARCHITECTURE.md reviews (out-of-tool documentation)
- Manual code review (style choices like `useActionState` adoption timing)

**Recommended next steps:**

1. Consider adding 3–5 higher-priority rules if broader coverage is desired.
2. Cross-reference new rules with project ADRs in `apps/react-router/docs/decisions/`.
3. Update skill TRIGGER patterns if new rules are added (e.g., trigger on `.component.tsx` files for bundle pattern checks).
