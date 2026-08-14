/**
 * The generic import/syntax restriction tables the ESLint configs compose.
 *
 * Why this exists: these tables are data, not configuration logic, and they are
 * the part that grows — every new boundary or banned dependency adds entries.
 * Keeping them beside the config rather than inside it holds
 * `eslint.custom-rules.shared.config.mjs` under the 350-line ceiling that
 * `vp run scripts:verify` enforces (see `.claude/rules/scripts.md`), and gives
 * each table one place to be read and reviewed.
 *
 * Everything here names a convention rather than a package of ours, which is why
 * it ships. A table that names `@lcabrera/ui` or `@lcabrera/server` is this
 * repository's own boundary and lives in its root `eslint.restrictions.repo.mjs`
 * instead (ADR-069).
 *
 * Compose these into a SINGLE value per rule: ESLint flat config replaces a rule
 * wholesale when a later config block sets it again, so a second block silently
 * drops the first one's restrictions. That is why they are exported at all — a
 * consumer adding its own `no-restricted-syntax` has to re-compose them, and
 * cannot do that without being able to name them.
 */

// `export *` re-exports whatever a module happens to expose today, so a barrel
// silently grows a public surface nobody reviewed and dead exports stay
// invisible. Barrels list what they publish (PATTERNS.md, react-components.md).
export const BARREL_SYNTAX_RESTRICTIONS = [
  {
    message:
      'Do not use `export *` in a barrel — re-export names explicitly, so the public surface is reviewed and dead exports stay visible.',
    selector: 'ExportAllDeclaration',
  },
];

// The store pattern is the only shared-state approach here (AGENTS.md Rule 5).
// Adding a state library is a one-line change that no other check would notice,
// so name them here rather than relying on review.
// React's `PropsWithChildren<P>` expands to `P & { children?: ReactNode |
// undefined }` — the child is OPTIONAL and NOT readonly, so it cannot satisfy
// Non-Negotiable Rule 1, and it silently makes `children` optional on
// components that require it (a provider cannot render without them). The
// convention here: a component wrapping a native element takes
// `ComponentPropsWithoutRef<'x'>` (which already carries `children`); anything
// else declares `readonly children: ReactNode` itself.
export const REACT_TYPE_IMPORT_PATHS = [
  {
    importNames: ['PropsWithChildren'],
    message:
      "`PropsWithChildren` makes children optional and non-readonly, which violates Rule 1. Use `ComponentPropsWithoutRef<'x'>` when wrapping a native element, otherwise declare `readonly children: ReactNode`.",
    name: 'react',
  },
];

// Tests import test utilities from `vite-plus/test`, not `vitest` directly — it
// re-exports the vite-plus-bundled Vitest, so the test runtime always matches
// the toolchain and there is no self-managed `vitest` to drift (ADR-045). This
// is what enforces that convention; the earlier `vitest`-direct rule drifted
// precisely because nothing gated it. Ban the bare specifier and any subpath.
export const TEST_RUNNER_IMPORT_PATTERNS = [
  {
    group: ['vitest', 'vitest/*'],
    message:
      'Import test utilities from `vite-plus/test`, not `vitest` — it re-exports the vite-plus-bundled Vitest so the test runtime matches the toolchain (ADR-045).',
  },
];

export const STATE_LIBRARY_IMPORT_PATTERNS = [
  {
    group: [
      'zustand',
      'zustand/*',
      'redux',
      'react-redux',
      '@reduxjs/*',
      'jotai',
      'jotai/*',
      'valtio',
      'valtio/*',
      'mobx',
      'mobx-react*',
    ],
    message:
      'The store pattern is the only shared-state approach here (AGENTS.md Rule 5, ADR-003). Use the split-context external store instead of a state library.',
  },
];

/** Import and both re-export forms, so a barrel cannot launder a restriction. */
const IMPORT_AND_REEXPORT_DECLARATIONS = [
  'ExportAllDeclaration',
  'ExportNamedDeclaration',
  'ImportDeclaration',
];

/** `importKind`/`exportKind` — the property that says "type-only" per form. */
const kindProperty = (declaration) =>
  declaration === 'ImportDeclaration' ? 'importKind' : 'exportKind';

/**
 * Node built-ins are server-only in anything that also runs in a browser. Keyed
 * on the `node:` protocol rather than on a module list, so a built-in nobody has
 * used yet is covered the day someone does.
 */
export const NODE_BUILTIN_IMPORT_BOUNDARY_SYNTAX_RESTRICTIONS =
  IMPORT_AND_REEXPORT_DECLARATIONS.map((declaration) => ({
    message:
      'Node built-ins are server-only. Move this import/export to server files.',
    selector: `${declaration}[source.value=/^node:/]`,
  }));

/**
 * Runtime database access is server-only, and the raw driver is the one import
 * that says so without naming anybody's package. Type-only imports are erased at
 * compile time, so they stay allowed; the guard is on runtime access, which is
 * what pulls the DB connection into the bundle.
 */
export const PG_DRIVER_IMPORT_BOUNDARY_SYNTAX_RESTRICTIONS =
  IMPORT_AND_REEXPORT_DECLARATIONS.map((declaration) => ({
    message:
      'Direct database access is server-only (the pg driver). Move this import to a `.server.ts` file or a `.server/` directory — or reach it through a server-only module.',
    selector: `${declaration}[${kindProperty(declaration)}!='type'][source.value='pg']`,
  }));
