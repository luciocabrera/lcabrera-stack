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

/**
 * The app's own `.env`, and nothing above it.
 *
 * A monorepo usually has a second file a level or two up — a compose env file,
 * a shared secrets file — but where that sits is the consuming repo's layout,
 * so it is passed in rather than assumed (ADR-069). Paths are relative to the
 * app directory, because that is the task's cwd.
 */
const DEFAULT_ENV_FILES = ['./.env'] as const;

/**
 * Sources one env file into the shell if it is there.
 *
 * Load-if-exists (`[ -f ]`) mirrors api-server's `--env-file-if-exists`, so a
 * missing file is skipped rather than fatal; the `tr -d "\r"` strips CRs from
 * Windows/WSL-authored .env files.
 */
const sourceEnvFile = (file: string) =>
  String.raw`[ -f ${file} ] && eval "$(tr -d "\r" < ${file})";`;

/**
 * A shell fragment that exports every variable in `envFiles`, later files
 * winning.
 *
 * react-router-serve serves the production build in-process, and these SSR apps'
 * loaders read DB_* from `process.env` at runtime (`getPool` → `readEnvConfig`).
 * A bare `react-router-serve` inherits none of those, so the first DB-backed
 * request throws a ZodError — while `vp dev` works because each app's `dev`
 * script loads the same files into the shell before serving. The prod `start`
 * task must do the same.
 */
export const createLoadLocalEnv = (
  envFiles: readonly string[] = DEFAULT_ENV_FILES,
) => `set -a; ${envFiles.map((file) => sourceEnvFile(file)).join(' ')} set +a;`;

export const createReactRouterRunConfig = ({
  envFiles = DEFAULT_ENV_FILES,
}: CreateReactRouterRunConfigArgs = {}) => ({
  tasks: {
    build: {
      cache: true,
      // Pin NODE_ENV so StyleX plugin mode is stable across all shell environments.
      // Exclude build output and generated types from the input fingerprint — without
      // this, files written by react-router build would be tracked as inputs on the
      // next run, causing guaranteed cache misses.
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
