import type { OxlintConfig } from 'vite-plus/lint';

/**
 * The Oxlint configuration a Vite+ monorepo loads once, from its ROOT
 * `vite.config.ts`.
 *
 * Vite+ reads `lint` from the root config only — a `lint` block in a workspace
 * config is never loaded (`node_modules/vite-plus/docs/guide/monorepo.md`).
 * Per-workspace differences are `overrides` here, with globs resolved from the
 * repo root.
 *
 * Rules belonging to ESLint plugins (`react-x`, `react-dom`, `@stylexjs`,
 * `local-rules`, `perfectionist`, `security`) are deliberately absent: the
 * eslint pass already runs all of them.
 */

/**
 * Which workspaces run where, as globs resolved from the repo root.
 *
 * This is a roster of the consuming repo's own directories, so it is an argument
 * rather than a constant (ADR-069). `env` only supplies globals to the
 * `no-undef` family, which is not enabled here, so these are inert as rules and
 * exact as documentation — they become load-bearing the moment a category
 * containing `no-undef` is turned on, which is why they are worth keeping
 * correct rather than dropping.
 *
 * `agnostic` exists so a workspace that targets neither runtime can be
 * classified rather than forgotten: this repo's gate
 * (`scripts/verify-lint-plugins.mjs`) fails when a workspace is in none of the
 * three lists, and a "not browser, not node" workspace otherwise has nowhere to
 * be.
 */
export type WorkspaceRuntimes = {
  readonly agnostic?: readonly string[];
  readonly browser?: readonly string[];
  readonly node?: readonly string[];
};

type CreateLintConfigArgs = {
  readonly overrides?: readonly OxlintConfigOverride[];
  readonly workspaceRuntimes?: WorkspaceRuntimes;
};

type OxlintConfigOverride = NonNullable<OxlintConfig['overrides']>[number];

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

/**
 * `.mjs`/`.cjs` and `scripts/` are Node wherever they sit, independently of
 * which workspace owns them — so this override is part of the config rather
 * than part of the caller's roster.
 */
const NODE_TOOLING_OVERRIDE: OxlintConfigOverride = {
  env: { node: true },
  files: ['**/*.mjs', '**/*.cjs', 'scripts/**'],
};

/** An `env` override per runtime, skipping any list the caller left empty. */
const runtimeOverrides = ({
  browser = [],
  node = [],
}: WorkspaceRuntimes): readonly OxlintConfigOverride[] => [
  ...(browser.length > 0
    ? [{ env: { browser: true }, files: [...browser] }]
    : []),
  ...(node.length > 0 ? [{ env: { node: true }, files: [...node] }] : []),
];

export const createLintConfig = ({
  overrides = [],
  workspaceRuntimes = {},
}: CreateLintConfigArgs = {}): OxlintConfig => ({
  // Oxlint defaults `correctness` to `warn`, and a warning fails nothing here —
  // `vp lint` and `vp check` both exit 0 on one.
  categories: { correctness: 'error' },
  env: { builtin: true, es2026: true },
  ignorePatterns: ['.react-router/', 'build/', 'dist/', 'out/', 'coverage/'],
  options: { typeAware: true, typeCheck: true },
  overrides: [
    ...runtimeOverrides(workspaceRuntimes),
    NODE_TOOLING_OVERRIDE,
    ...overrides,
  ],
  plugins: [...PLUGINS],
  rules: {
    // Express's `next` IS the error channel, so `.catch(next)` is the framework's
    // own async adapter, not a node-style callback the rule can double-invoke.
    // An option keeps the rule live for every other callback name; restructuring
    // does not help, because the rule matches the name rather than the shape.
    'promise/no-callback-in-promise': ['error', { exceptions: ['next'] }],
  },
});
