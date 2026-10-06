import type { Outcome } from './stats.types.ts';

export const EXCLUDED_OUTCOMES: readonly Outcome[] = [
  'error',
  'timeout',
  'skipped',
];

export const MIN_BASELINE_RUNS = 2;
