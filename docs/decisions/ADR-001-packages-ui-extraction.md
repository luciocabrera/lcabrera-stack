# ADR-001: Extract `packages/ui` from `apps/react-router`

**Status:** Accepted

## Context

A second app needed to reuse `apps/react-router`'s component library (Table, forms, layout primitives) rather than duplicating it. No such sharing mechanism existed: `apps/react-router` is a leaf app with no `exports`/library setup, and the second app had no way to import from it. This was confirmed by direct exploration during planning, not assumed.

Before moving Table (the component that second app needed most, for its list screens and a JSON-table explorer), its actual dependency closure was mapped by grepping cross-file imports rather than guessing. It turned out to be far larger than initially scoped: 23 of the app's 24 top-level components, 3 app-level contexts (`GlobalSettingsContext`, `NotificationContext`, `ThemeContext`), the entire `hooks/` and `design-system/` directories, and a subset of `constants/`, `types/`, and `utils/`. Table alone pulls in `Button`, `Checkbox`, `DraggableList`, `InfoBox`, `PinSideModal`, `Title`, `ToggleSwitch`, `VirtualList`, `VirtualSelect`, `Tag`, `RadioOptionGroup`, and both `GlobalSettingsContext` (pin-side/unpin-conflict preferences) and `NotificationContext` (error toasts) as hard dependencies, transitively.

## Decision

1. **Move the full dependency closure**, not just Table and a few named components. Partial migration would leave Table non-functional in its new home. Two app-level contexts (`GlobalSettingsContext`, `NotificationContext`) moved into `packages/ui` rather than being decoupled from Table via props — both apps now share one definition of navigation preferences and the notification system, a deliberate coupling accepted in exchange for not having to refactor Table's internals in this pass.
2. **No build step, no `tsconfig.json`, no `package.json` `exports` map** for `packages/ui` — it mirrors the existing `@repo/utils` pattern (raw `.ts`/`.tsx` source, resolved directly by whichever consumer's Vite/TypeScript instance processes it). `packages/ui/package.json` declares real `dependencies`/`devDependencies` (`react`, `react-dom`, `react-router`, `@stylexjs/stylex`, test libs) so pnpm's strict linking gives it visibility into them — a package with zero declared dependencies cannot resolve them from its own directory under pnpm's default strictness, even inside a workspace.
3. **Consumption is a `@repo/ui/*` → `packages/ui/src/*` alias**, declared in three places per consuming app (mirroring exactly how `@/*` already works for the app's own `src/`):
   - `tsconfig.app.json`'s `compilerOptions.paths` (for `tsc`/editor resolution — gets `.ts`/`.tsx`/`index.ts` extension inference for free, unlike a `package.json` `exports` map).
   - `vite.config.ts`'s `resolve.alias` (for actual Vite/Vitest bundling — `tsconfigPaths: true` alone did not reliably resolve a specifier shaped like a real installed package name at bundle time, only at typecheck time).
   - `packages/vite-configs/vite.plugins.shared.config.ts`'s StyleX `aliases` map (StyleX's babel plugin does its own independent file resolution for cross-file `.stylex.ts` token imports; it does not read tsconfig or Vite's alias config).
     A `package.json` `exports` wildcard (`"./*": "./src/*"`) was tried first and rejected: Node's exports-map resolution does not fall back to `index.ts` for a directory the way `tsconfig`/Vite path aliases do, which broke every component with an `index.ts` barrel.
4. **Vitest's `include` is widened** in `apps/react-router/vite.config.ts` to also cover `../../packages/ui/src/**/*.test.*`. `packages/ui` has no test runner of its own (no build step, no vite.config.ts) — without this, its ~300 test files would not run under any command, silently. `apps/react-router` is the sole consumer today; when a second app starts consuming `packages/ui`, its own Vitest config should get the same `include` addition — tests will then run twice (once per consuming app), which is redundant but harmless given the tests are pure.

## Consequences

- `packages/ui` now holds nearly the entire pre-existing shared UI foundation of `apps/react-router`, not a small curated subset. Future additions to either app's foundational layer (a new global context, a new base hook) should default to living in `packages/ui` from the start, per the existing "shared components get extended, not worked around" principle, rather than being added to `apps/react-router/src` and requiring a second migration later.
- Two apps now share one `GlobalSettingsContext`/`NotificationContext`/`ThemeContext` — a behavior change in `apps/react-router` (none — it's the same code, just relocated) but a real coupling going forward: a change to notification/settings/theme behavior for one app's sake now also affects the other, and vice versa.
- Added `inferTableColumnsFromJson.util.ts` (`packages/ui/src/components/Table/utils/`) as the concrete "runtime-inferred columns" capability this extraction was partly motivated by. It required **no change to `Table`'s own component API** — `TableColumn<TData>[]` was already agnostic to whether `TData` is a compile-time-known shape or `Record<string, unknown>`, so the new capability is purely a new utility that produces a `TableColumn[]` array, not a modification to `Table` itself. The earlier tech spec's framing ("changes Table's public API") was more pessimistic than the actual code required.

## Verification performed

`vp fmt`, `vp lint`, `tsc --noEmit`, and `vp run test` all run clean from `apps/react-router` (311 test files, 1315 tests passing) after the move. One pre-existing, unrelated type error in `packages/plugins/fixReactRouterAssets.plugin.ts` remains — confirmed via `git log`/`git status` to predate this change and be untouched by it.
