/**
 * Emits an Istanbul-shaped `coverage/coverage-final.json` via the v8
 * provider's `json` reporter — the format `fallow audit --coverage` reads.
 *
 * Shared so every workspace reports coverage identically and the merged
 * report the fallow gate consumes (scripts/merge-coverage.mjs) stays
 * consistent. Without real coverage fallow *estimates* it from whether a
 * colocated test file exists (none → 0%), and since CRAP is
 * `cyclomatic² × (1 − coverage)³ + cyclomatic` against a threshold of 30,
 * every function with cyclomatic ≥ 5 then fails the gate on complexity it
 * does not actually have.
 */
export const VITEST_COVERAGE_FLAGS =
  '--coverage --coverage.provider=v8 --coverage.reporter=json --coverage.reportsDirectory=coverage';

export const createReactRouterRunConfig = () => ({
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
      command:
        'if [ ! -f ./build/server/index.js ]; then react-router build; fi && react-router-serve ./build/server/index.js',
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
