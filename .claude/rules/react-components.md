---
paths: ['**/*.tsx', '**/*.jsx', '**/*.stylex.ts']
---

# React Component Standards

> Before creating or modifying any component, also read `packages/ui/src/PATTERNS.md` (shared component conventions) and consult the nearest `INVENTORY.md` (`packages/ui/src/INVENTORY.md`, `apps/react-router/src/INVENTORY.md`, `apps/admin_system/src/INVENTORY.md`, `packages/data-access/src/INVENTORY.md`). For full React 19 hook/compiler patterns, invoke the `react-19` skill; for shared state, invoke the `store-pattern` skill.

## Component File Structure (Bundle Pattern)

Every component gets its own directory:

```
ComponentName/
├── ComponentName.component.tsx  # Implementation
├── ComponentName.types.ts       # Type definitions
├── ComponentName.stylex.ts      # StyleX styles
├── ComponentName.test.tsx       # Tests (colocated)
└── index.ts                     # Barrel export (public API)
```

## Component Declaration

```typescript
type ButtonProps = {
  readonly disabled?: boolean;
  readonly label: string;
  readonly onClick: () => void;
};

export const Button = ({ disabled = false, label, onClick }: ButtonProps) => {
  return <button disabled={disabled} onClick={onClick}>{label}</button>;
};
```

## Barrel Files

Each **public** directory exposes a controlled API via `index.ts`. Use explicit named exports, never `export *`.

```typescript
export { Button } from './Button';
// Props type re-export ONLY when an external consumer actually imports it:
export type { ButtonProps } from './Button.types';
```

- Re-export a Props/aux type from the barrel **only when it is consumed externally** (ADR-007: remove unused re-exports; fallow flags them as `unused-types`). Internal consumers import types directly from the `.types.ts` file.
- Private delegates (subcomponents/utils consumed only inside their parent module) are imported via direct file paths and get **no** `index.ts` — ADR-007 rule 3 bans deep implementation barrels nobody imports through.

## Props Naming

| Type                | Pattern                | Example                       |
| ------------------- | ---------------------- | ----------------------------- |
| Event handler props | `on[Event]`            | `onClick`, `onSave`           |
| Internal handlers   | `handle[Event]`        | `handleClick`, `handleSubmit` |
| Boolean props       | `is/has/should[State]` | `isLoading`, `hasError`       |
| Render props        | `render[Thing]`        | `renderHeader`, `renderEmpty` |

## Composition Over Big JSX Blocks

Prefer composition (children, slots) over props-driven configuration to avoid prop explosion.

**Split as you go, not after the fact.** The goal is to never need a "break this component up" refactor because it grew unmanageable. Composing small pieces from the start is cheaper than extracting them later.

Stop and split into sub-components/hooks/slots as soon as any of these show up:

- The render function nests more than ~2 levels of conditional or mapped JSX.
- A single component file mixes more than one concern (e.g. data-fetching wiring + layout + a `.map()` producing multi-element rows).
- You're about to pass more than ~6-8 props to configure different "modes" of one component — that's a sign the modes should be separate components instead.
- The function body is approaching ~60 lines (see fallow's unit-size health check) — smaller, single-purpose components are also easier to unit test and reuse independently.

**Simple case — flat composition.** Model multi-part presentational components after `packages/ui/src/components/Card/` (see its `ARCHITECTURE.md`): a thin root component (`Card`) plus independent sibling sub-components (`CardHeader`, `CardTitle`, `CardDescription`, `CardBody`, `CardFooter`), each in its own bundle directory with its own types/styles/tests, composed by the consumer rather than configured through props.

**Complex/stateful case — split contexts + deep component tree.** Model feature-rich, stateful components after `packages/ui/src/components/Table/` (see its `ARCHITECTURE.md`): state is split across narrow-purpose providers (`TableConfigProvider`, `TableDataProvider`, `FiltersDataProvider`, `TableWrapperContext`) instead of one giant context, and rendering is a deep tree of single-purpose components (`TableHeader` → `TableHeaderCell`, `TableBody` → `TableRow` → `TableBodyCell`, ...) instead of one component branching on every feature flag. Invoke the `store-pattern` skill before adding any new store/context/selector/action in this style.

## React 19 Mandatory Rules

- **Always `use()`, never `useContext()`** — `use()` is conditional-safe and supports Promises; `useContext` is forbidden in this codebase.
- **Single store snapshot per action** — call `store.get()` exactly once per execution, assign to a const, read all properties from it.
- React Compiler handles most memoization automatically — favor correct code over manual optimization (see ADR-004).

## Styling — StyleX Only

- **All styling uses StyleX.** No inline styles, no CSS modules, no styled-components, no Tailwind.
- Styles live in `*.stylex.ts` files alongside their component.
- Use design system tokens from `@/design-system/tokens/` instead of hardcoded values.

```typescript
// Component.stylex.ts
import * as stylex from '@stylexjs/stylex';
import { spacing, borderRadius } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  base: { padding: spacing.md, borderRadius: borderRadius.md },
  primary: { backgroundColor: colors.brandPrimary },
  disabled: { opacity: 0.5, cursor: 'not-allowed' },
});

// Component.tsx
<button {...stylex.props(styles.base, variant === 'primary' && styles.primary)} />
```

### Forbidden

- `style={...}` (inline styles) — runtime cost, no type safety
- `onClick={() => handler()}` in JSX — creates new reference each render, breaks memoization
- CSS Modules, Styled Components, Tailwind — inconsistent with architecture

## Reuse Before Building — Avoid Hidden Duplication

Before creating any new component, hook, or util, check the nearest `INVENTORY.md` first (see the note at the top of this file). If something already covers the need, use it; if something almost covers it, enhance it to be more generic instead of forking a near-copy — only build something new when nothing in the inventory is a reasonable fit.

**Watch for semantic duplication, not just structural duplication.** Static clone-detection tools (fallow dupes, SonarQube CPD) only catch byte-for-byte or structurally identical code — they will NOT catch two functions/hooks with different names that solve the same problem through slightly different mechanisms. This codebase already has an example: `setThemeCookie` persists a value by `fetch()`-POSTing to `PERSIST_COOKIE_ACTION` so the server sets the cookie, while `writeToCookie`/`writePersistedUiFlagsToCookie` write `document.cookie` or append a `Set-Cookie` header directly — three different code paths for what is conceptually one operation ("persist this value to a cookie"). None of these show up as duplicates in a clone scan because their implementations diverge, even though their purpose doesn't.

- **Search by behavior, not by name.** Before writing a new persistence/formatting/derivation helper, grep for the domain noun (e.g. `Cookie`, `Storage`, `Persist`) and read what each match actually _does_, not just its signature — a different name or slightly different call shape doesn't mean it's a different concern.
- **Prefer parameterizing over forking.** If two pieces of logic do the same job differently, consolidate them into one utility/hook with a parameter for the variation (e.g. an optional `headers` argument to choose the SSR vs. client write path) rather than leaving multiple near-equivalent implementations in place.
- **Flag it when you see it.** If you encounter divergent-but-equivalent logic while touching a file for an unrelated change, call it out and prefer collapsing it into one utility rather than adding a fourth variant next to the other three.
