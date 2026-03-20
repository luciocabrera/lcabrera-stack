# ADR-005: StyleX for All Styling

**Status:** Accepted

## Context

The project needs a styling solution. Options considered: Tailwind CSS, CSS Modules, vanilla CSS, Emotion/styled-components, and StyleX.

## Decision

Use **StyleX** exclusively for all component styles. No Tailwind, no CSS Modules, no inline `style` props for design values.

## Reasons

- **Type-safe** — StyleX styles are plain TypeScript objects; invalid property names and values are caught at compile time.
- **Atomic CSS output** — StyleX generates atomic CSS classes, eliminating specificity conflicts and dead CSS automatically.
- **Deterministic composition** — `stylex.props(a, b, c)` applies styles in argument order with well-defined override semantics; no specificity wars.
- **Zero runtime (prod)** — StyleX extracts all styles to a static CSS file at build time; the runtime is only needed in dev for HMR.
- **Colocation** — styles live in `.stylex.ts` files next to components, not in global CSS files.
- **Theme support** — `defineVars` / `createTheme` provides type-safe theming without CSS custom property naming collisions.

## Consequences

- **No raw CSS values** in component files — all values must come from design tokens (`spacing.*`, `colors.*`, etc.) or be explicitly justified.
- **No `className` prop on design-system components** — consumers use `customStylex?: StyleXStyles` for overrides.
- **`stylex.props()` spread must come after `{...rest}`** in components that forward HTML props, so StyleX styles always win.
- `DevStyleXInject` must be rendered at the app root to inject styles in both dev (HMR) and prod (static file).
- Tooling: `vp lint` includes `@stylexjs/eslint-plugin` rules (`valid-styles`, etc.) that enforce correct StyleX usage.
