/**
 * Emits two Istanbul-shaped reports under `coverage/` via the v8 provider:
 *
 * - `coverage-final.json` (`json` reporter) — the per-statement detail
 *   `fallow audit --coverage` reads (via scripts/merge-coverage.mjs).
 * - `coverage-summary.json` (`json-summary` reporter) — the per-workspace
 *   totals the CI coverage comment reads (via scripts/coverage-report.mjs).
 *
 * Shared so every workspace reports coverage identically and both consumers —
 * the fallow gate and the PR coverage matrix — stay consistent. Without real
 * coverage fallow *estimates* it from whether a colocated test file exists
 * (none → 0%), and since CRAP is `cyclomatic² × (1 − coverage)³ + cyclomatic`
 * against a threshold of 30, every function with cyclomatic ≥ 5 then fails the
 * gate on complexity it does not actually have.
 */
export const VITEST_COVERAGE_FLAGS =
  '--coverage --coverage.provider=v8 --coverage.reporter=json --coverage.reporter=json-summary --coverage.reportsDirectory=coverage';

type CreateReactRouterRunConfigArgs = {
  readonly envFiles?: readonly string[];
};

const DEFAULT_ENV_FILES = ['./.env'] as const;

const sourceEnvFile = (file: string) =>
  String.raw`[ -f ${file} ] && eval "$(tr -d "\r" < ${file})";`;

export const createLoadLocalEnv = (
  envFiles: readonly string[] = DEFAULT_ENV_FILES,
) => `set -a; ${envFiles.map((file) => sourceEnvFile(file)).join(' ')} set +a;`;

export const createReactRouterRunConfig = ({
  envFiles = DEFAULT_ENV_FILES,
}: CreateReactRouterRunConfigArgs = {}) => ({
  tasks: {
    build: {
      cache: true,
      command: 'NODE_ENV=production react-router build',
      env: ['NODE_ENV'],
      input: [
        { auto: true },
        '!build/**',
        '!.react-router/**',
        '!node_modules/.vite-temp/**',
      ],
    },
    start: {
      command: `${createLoadLocalEnv(envFiles)} if [ ! -f ./build/server/index.js ]; then react-router build; fi && exec react-router-serve ./build/server/index.js`,
    },
    test: {
      cache: false,
      command: 'node node_modules/vitest/vitest.mjs run',
    },
    'test:coverage': {
      cache: false,
      command: `node node_modules/vitest/vitest.mjs run ${VITEST_COVERAGE_FLAGS}`,
    },
  },
});
