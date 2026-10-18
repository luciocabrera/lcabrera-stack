import { summarize } from '@repo/eval-history/stats/summarize.util';

import { EVALS_SCORED } from '../constants/evalsDashboard.constants';

export const dimensionBand = (runMeans: readonly number[]) => {
  const summary = summarize(runMeans);

  if (summary.kind === 'insufficient') {
    return;
  }

  const half = EVALS_SCORED.sigma * summary.stddev;

  return {
    lower: summary.mean - half,
    mean: summary.mean,
    runs: summary.n,
    upper: summary.mean + half,
  };
};
