/**
 * Import/syntax restriction tables shared by the React ESLint config.
 *
 * Why this exists: these tables are data, not configuration logic, and they are
 * the part that grows — every new boundary or banned dependency adds entries.
 * Keeping them beside the config rather than inside it holds
 * `eslint.custom-rules.shared.config.mjs` under the 350-line ceiling that
 * `vp run scripts:verify` enforces (see `.claude/rules/scripts.md`), and gives
 * each table one place to be read and reviewed.
 *
 * Consumers compose these into a SINGLE value per rule: ESLint flat config
 * replaces a rule wholesale when a later config block sets it again, so a
 * second block would silently drop the first one's restrictions.
 */

export const UI_PUBLIC_IMPORT_BOUNDARY_PATTERNS = [
  {
    group: ['@lcabrera/ui/src/**'],
    message:
      'Do not import from @lcabrera/ui source internals. Use @lcabrera/ui public exports or supported subpaths.',
  },
  {
    group: ['@lcabrera/ui/**/index', '@lcabrera/ui/**/index.*'],
    message:
      'Do not import @lcabrera/ui index files directly. Use the folder path or @lcabrera/ui root exports.',
  },
  {
    group: [
      '@lcabrera/ui/**/*.component',
      '!@lcabrera/ui/components/Settings/Settings.component',
    ],
    message:
      'Do not import component implementation files directly from @lcabrera/ui. Import from @lcabrera/ui root exports or component barrels.',
  },
];

// Runtime database access is server-only. Match the whole `@lcabrera/server/db`
// import path — not individual utils, which drift as they are added and removed —
// plus the raw `pg` driver, and cover both direct imports and barrel re-exports.
// Type-only imports are erased at compile time, so they stay allowed (e.g. the
// `query-builder.types` the pure `db/query-builder/*` builders share); the guard is
// on runtime access, which is what pulls the DB connection into the bundle.
const SERVER_ONLY_DB_MESSAGE =
  'Direct database access is server-only (the pg driver and @lcabrera/server/db runtime helpers). Move this import to a `.server.ts` file or a `.server/` directory — or reach it through a server-only module.';

const DB_IMPORT_BOUNDARY_RESTRICTIONS = [
  'ImportDeclaration',
  'ExportAllDeclaration',
  'ExportNamedDeclaration',
].flatMap((declaration) => {
  const kind =
    declaration === 'ImportDeclaration' ? 'importKind' : 'exportKind';

  return [
    String.raw`${declaration}[${kind}!='type'][source.value=/^@lcabrera\/server\/db\//]`,
    `${declaration}[${kind}!='type'][source.value='pg']`,
  ].map((selector) => ({ message: SERVER_ONLY_DB_MESSAGE, selector }));
});

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

// Non-Negotiable Rule 5: the store pattern is the only shared-state approach in
// this repo. Adding a state library is a one-line change that no other check
// would notice, so name them here rather than relying on review.
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

export const CLIENT_IMPORT_BOUNDARY_SYNTAX_RESTRICTIONS = [
  {
    message:
      'Node built-ins are server-only. Move this import/export to server files.',
    selector: 'ExportAllDeclaration[source.value=/^node:/]',
  },
  {
    message:
      'Node built-ins are server-only. Move this import/export to server files.',
    selector: 'ExportNamedDeclaration[source.value=/^node:/]',
  },
  {
    message:
      'Node built-ins are server-only. Move this import/export to server files.',
    selector: 'ImportDeclaration[source.value=/^node:/]',
  },
  {
    message:
      'Server-only UI helpers must be imported via @lcabrera/ui/server from server entry files only.',
    selector:
      "ImportDeclaration[source.value='@lcabrera/ui/entry/createHandleRequest.util']",
  },
  {
    message:
      'The @lcabrera/ui/server entrypoint is server-only and must not be imported from client/shared files.',
    selector: "ImportDeclaration[source.value='@lcabrera/ui/server']",
  },
  ...DB_IMPORT_BOUNDARY_RESTRICTIONS,
];
