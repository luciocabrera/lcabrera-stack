/**
 * The Oxlint configuration a Vite+ monorepo loads once, from its ROOT
 * `vite.config.ts`. Vite+ reads `lint` from the root config only — a `lint`
 * block in a workspace config is never loaded
 * (`node_modules/vite-plus/docs/guide/monorepo.md`) — so per-workspace
 * differences are `overrides` here, with globs resolved from the repo root.
 *
 * Rules belonging to ESLint plugins (`react-x`, `react-dom`, `@stylexjs`,
 * `local-rules`, `perfectionist`, `security`) are deliberately absent: the
 * eslint pass already runs all of them.
 *
 * The workspace rosters are the consuming repo's own directories, so they are an
 * argument rather than a constant (ADR-069). `env` only supplies globals to the
 * `no-undef` family, which is not enabled here, so they are inert as rules and
 * exact as documentation. `agnostic` exists so a workspace targeting neither
 * runtime can be classified rather than forgotten.
 */

import type { OxlintConfig } from 'vite-plus/lint';

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

const PLUGINS = [
  'eslint',
  'oxc',
  'typescript',
  'unicorn',
  'import',
  'promise',
  'react',
] as const;

const NODE_TOOLING_OVERRIDE: OxlintConfigOverride = {
  env: { node: true },
  files: ['**/*.mjs', '**/*.cjs', 'scripts/**'],
};

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
    'promise/no-callback-in-promise': ['error', { exceptions: ['next'] }],
  },
});
