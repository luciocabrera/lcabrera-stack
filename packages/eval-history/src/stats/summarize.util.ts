import { MIN_BASELINE_RUNS } from './stats.constants.ts';

export const summarize = (values: readonly number[]) => {
  const n = values.length;

  if (n < MIN_BASELINE_RUNS) {
    return { kind: 'insufficient', n } as const;
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / n;
  const squares = values.reduce((sum, value) => sum + (value - mean) ** 2, 0);

  return {
    kind: 'summary',
    mean,
    n,
    stddev: Math.sqrt(squares / (n - 1)),
  } as const;
};
