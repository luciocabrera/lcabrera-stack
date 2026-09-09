export default {
  commandRunner: { command: 'node node_modules/vitest/vitest.mjs run' },
  concurrency: 4,
  coverageAnalysis: 'off',
  jsonReporter: { fileName: '../../reports/mutation/full-latest.json' },
  mutate: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.types.ts',
    '!src/**/*.constants.ts',
  ],
  reporters: ['clear-text', 'progress', 'json'],
  testRunner: 'command',
  thresholds: { break: null },
  timeoutMS: 30_000,
};
