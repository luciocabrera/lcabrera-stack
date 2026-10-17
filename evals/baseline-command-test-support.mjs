/**
 * What a `runBaseline` test needs around it: a baseline id, the commit it was
 * started on, the runs an earlier chunk left, and every effect stubbed, so no
 * test calls a model, a database or git.
 * Usage: imported by the `baseline-*.test.mjs` files under `evals/`.
 */
import { vi } from 'vite-plus/test';

export const BASELINE = '11111111-1111-4111-8111-111111111111';

export const HEAD = 'a'.repeat(40);

export const OTHER_SHA = 'b'.repeat(40);

export const PRIOR_FILE = `.tmp/eval-results/skills/${BASELINE}.json`;

export const priorRuns = (overrides = {}) => ({
  files: [PRIOR_FILE],
  gitShas: [HEAD],
  modelIds: ['claude-opus-5-5'],
  ...overrides,
});

export const effectsFor = (overrides = {}) => ({
  baselineSoFar: vi.fn(() => Promise.resolve(priorRuns())),
  checkRuns: vi.fn(() => Promise.resolve([])),
  error: vi.fn(),
  gitHead: vi.fn(() => HEAD),
  gitStatus: vi.fn(() => ''),
  log: vi.fn(),
  mintId: vi.fn(() => BASELINE),
  probeDatabase: vi.fn(() => Promise.resolve({ ok: true })),
  record: vi.fn(() => Promise.resolve(0)),
  runOnce: vi.fn(() => ({ signal: null, status: 1 })),
  ...overrides,
});
