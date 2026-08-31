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
 *
 * `export *` re-exports whatever a module happens to expose today, so a barrel
 * silently grows a public surface nobody reviewed and dead exports stay
 * invisible. Barrels list what they publish.
 */

export const BARREL_SYNTAX_RESTRICTIONS = [
  {
    message:
      'Do not use `export *` in a barrel — re-export names explicitly, so the public surface is reviewed and dead exports stay visible.',
    selector: 'ExportAllDeclaration',
  },
];

export const REACT_TYPE_IMPORT_PATHS = [
  {
    importNames: ['PropsWithChildren'],
    message:
      "`PropsWithChildren` makes children optional and non-readonly, which violates Rule 1. Use `ComponentPropsWithoutRef<'x'>` when wrapping a native element, otherwise declare `readonly children: ReactNode`.",
    name: 'react',
  },
];

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

const IMPORT_AND_REEXPORT_DECLARATIONS = [
  'ExportAllDeclaration',
  'ExportNamedDeclaration',
  'ImportDeclaration',
];

const kindProperty = (declaration) =>
  declaration === 'ImportDeclaration' ? 'importKind' : 'exportKind';

export const NODE_BUILTIN_IMPORT_BOUNDARY_SYNTAX_RESTRICTIONS =
  IMPORT_AND_REEXPORT_DECLARATIONS.map((declaration) => ({
    message:
      'Node built-ins are server-only. Move this import/export to server files.',
    selector: `${declaration}[source.value=/^node:/]`,
  }));

export const PG_DRIVER_IMPORT_BOUNDARY_SYNTAX_RESTRICTIONS =
  IMPORT_AND_REEXPORT_DECLARATIONS.map((declaration) => ({
    message:
      'Direct database access is server-only (the pg driver). Move this import to a `.server.ts` file or a `.server/` directory — or reach it through a server-only module.',
    selector: `${declaration}[${kindProperty(declaration)}!='type'][source.value='pg']`,
  }));
