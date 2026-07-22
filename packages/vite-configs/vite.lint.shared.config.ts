import type { OxlintConfig } from 'vite-plus/lint';

/**
 * The repo's one Oxlint configuration.
 *
 * Vite+ reads `lint` from the ROOT `vite.config.ts` only — a `lint` block in a
 * workspace config is never loaded (`node_modules/vite-plus/docs/guide/monorepo.md`).
 * Per-workspace differences are `overrides` here, with globs resolved from the
 * repo root.
 *
 * Rules belonging to ESLint plugins (`react-x`, `react-dom`, `@stylexjs`,
 * `local-rules`, `perfectionist`, `security`) are deliberately absent: the
 * eslint pass already runs all of them.
 */

/** Workspaces whose code runs in a browser. */
const BROWSER_WORKSPACES = [
  'apps/react-router/**',
  'apps/admin_system/**',
  'packages/ui/**',
];

/** Workspaces whose code runs in Node. */
const NODE_WORKSPACES = [
  'apps/api-server/**',
  'apps/api-server-fast/**',
  'apps/scan-orchestrator/**',
  'apps/shared/**',
  'packages/agent-runner/**',
  'packages/node-runtime/**',
  'packages/scan-ingestion/**',
  'packages/server/**',
];

/**
 * Every plugin Oxlint should load.
 *
 * Naming `plugins` REPLACES Oxlint's default set rather than adding to it, so
 * the defaults have to be repeated — omitting one switches that whole family
 * off repo-wide and reports nothing. `scripts/verify-lint-plugins.mjs` proves
 * each family is live by linting a deliberate violation.
 *
 * A plugin only contributes rules whose category is enabled below, so listing
 * one whose rules all sit in a disabled category is decorative — it reads as
 * protection that is not there. `node` and `react-perf` were dropped for that
 * reason. `jsx-a11y` and `vitest` do contribute, and are held back pending
 * their own decisions (#325, #326).
 *
 * To re-measure a plugin's contribution, drop it from this list and compare
 * `number_of_rules` from `vp lint --format=json`.
 */
const PLUGINS = [
  'eslint',
  'oxc',
  'typescript',
  'unicorn',
  'import',
  'promise',
  'react',
] as const;

export const lintSharedConfig: OxlintConfig = {
  // Oxlint defaults `correctness` to `warn`, and a warning fails nothing here —
  // `vp lint` and `vp check` both exit 0 on one.
  categories: { correctness: 'error' },
  env: { builtin: true, es2026: true },
  ignorePatterns: [
    '.react-router/',
    'build/',
    'dist/',
    'out/',
    'coverage/',
    'miscelanious/',
  ],
  options: { typeAware: true, typeCheck: true },
  overrides: [
    { env: { browser: true }, files: BROWSER_WORKSPACES },
    { env: { node: true }, files: NODE_WORKSPACES },
    { env: { node: true }, files: ['**/*.mjs', '**/*.cjs', 'scripts/**'] },
  ],
  plugins: [...PLUGINS],
  rules: {
    // Express's `next` IS the error channel, so `.catch(next)` is the framework's
    // own async adapter, not a node-style callback the rule can double-invoke.
    // An option keeps the rule live for every other callback name; restructuring
    // does not help, because the rule matches the name rather than the shape.
    'promise/no-callback-in-promise': ['error', { exceptions: ['next'] }],
  },
};
