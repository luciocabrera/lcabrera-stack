---
paths: ['**/*.tsx', '**/*.jsx', '**/*.stylex.ts']
---

# React Component Standards

> Before creating or modifying any component, also read `apps/react-router/src/components/PATTERNS.md` and consult `apps/react-router/src/INVENTORY.md`. For full React 19 hook/compiler patterns, invoke the `react-19` skill; for shared state, invoke the `store-pattern` skill.

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

Each directory exposes a controlled public API via `index.ts`. Use explicit named exports, never `export *`.

```typescript
export { Button } from './Button';
export type { ButtonProps } from './Button.types';
```

## Props Naming

| Type                | Pattern                | Example                       |
| ------------------- | ---------------------- | ----------------------------- |
| Event handler props | `on[Event]`            | `onClick`, `onSave`           |
| Internal handlers   | `handle[Event]`        | `handleClick`, `handleSubmit` |
| Boolean props       | `is/has/should[State]` | `isLoading`, `hasError`       |
| Render props        | `render[Thing]`        | `renderHeader`, `renderEmpty` |

## Composition Over Configuration

Prefer composition (children, slots) over props-driven configuration to avoid prop explosion.

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
