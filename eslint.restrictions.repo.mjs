/**
 * This repository's own ESLint import boundaries — the tables that name
 * `@lcabrera/ui` and `@lcabrera/server`.
 *
 * They live here rather than in `@lcabrera/vite-config` because they are data
 * about this repo's packages, and a consumer of the config package has neither
 * (ADR-069). The generic half — barrels, state libraries, the test runner, the
 * `node:` protocol, the `pg` driver — ships from
 * `@lcabrera/vite-config/eslint-restrictions` and is composed alongside these by
 * each workspace's `eslint.config.mjs`.
 *
 * Compose, never re-declare: ESLint flat config replaces a rule wholesale when a
 * later block sets it again, so a workspace that adds its own
 * `no-restricted-syntax` after the factory's silently drops everything below.
 */

/**
 * These are a courtesy, not the boundary. The boundary is `packages/ui`'s
 * `exports` map, which names every public subpath and no longer carries a
 * wildcard — an unlisted path does not resolve for a consumer at all. What
 * these patterns buy is a message at the import site instead of a resolution
 * error, and they still cover the in-repo case, where a tsconfig `paths` alias
 * resolves `@lcabrera/ui/*` straight to `src/` and would otherwise hide the
 * breakage until publish.
 *
 * `#ui/*` is deliberately absent: it is package-internal, so nothing outside
 * `packages/ui` can resolve it and there is nothing to restrict.
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

// Match the whole `@lcabrera/server/db` import path — not individual utils,
// which drift as they are added and removed — and cover both direct imports and
// barrel re-exports. Type-only imports are erased at compile time, so they stay
// allowed (e.g. the `query-builder.types` the pure `db/query-builder/*` builders
// share); the guard is on runtime access, which is what pulls the DB connection
// into the bundle. The raw `pg` driver is banned by the generic table that ships
// with the config package.
const SERVER_ONLY_DB_MESSAGE =
  'Direct database access is server-only (the @lcabrera/server/db runtime helpers). Move this import to a `.server.ts` file or a `.server/` directory — or reach it through a server-only module.';

const SERVER_DB_IMPORT_BOUNDARY_RESTRICTIONS = [
  'ExportAllDeclaration',
  'ExportNamedDeclaration',
  'ImportDeclaration',
].map((declaration) => {
  const kind =
    declaration === 'ImportDeclaration' ? 'importKind' : 'exportKind';

  return {
    message: SERVER_ONLY_DB_MESSAGE,
    selector: String.raw`${declaration}[${kind}!='type'][source.value=/^@lcabrera\/server\/db\//]`,
  };
});

/**
 * The server-only surfaces of this repo's own packages, for the workspaces that
 * ship a client bundle. Pair it with the generic `node:` and `pg` tables from
 * `@lcabrera/vite-config/eslint-restrictions` — they are separate because only
 * these name a package of ours.
 */
export const REPO_SERVER_ONLY_IMPORT_BOUNDARY_SYNTAX_RESTRICTIONS = [
  {
    // Both spellings: `#ui/…` is how `packages/ui` reaches its own file, and
    // `@lcabrera/ui/…` is what an app would have to write. The latter no longer
    // resolves for a consumer either, since the subpath is not exported.
    message:
      'Server-only UI helpers must be imported via @lcabrera/ui/server from server entry files only.',
    selector: String.raw`ImportDeclaration[source.value=/^(?:@lcabrera\/ui|#ui)\/entry\/createHandleRequest\.util$/]`,
  },
  {
    message:
      'The @lcabrera/ui/server entrypoint is server-only and must not be imported from client/shared files.',
    selector: "ImportDeclaration[source.value='@lcabrera/ui/server']",
  },
  ...SERVER_DB_IMPORT_BOUNDARY_RESTRICTIONS,
];
