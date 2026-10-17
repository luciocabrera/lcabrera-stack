import type { RunSummary } from '@repo/eval-history/queries/queries.types';

import { wilson } from '@repo/eval-history/stats/wilson.util';

import { EVALS_INTERVAL } from '../constants/evalsDashboard.constants';

export const runFigures = (run: RunSummary) => {
  const interval = wilson({
    k: run.k,
    minN: EVALS_INTERVAL.minTrialsForRate,
    n: run.n,
    z: EVALS_INTERVAL.z,
  });

  return {
    ...run,
    durationMs: run.finishedAt.getTime() - run.startedAt.getTime(),
    finishedAt: run.finishedAt.toISOString(),
    lower: interval.kind === 'rate' ? interval.lower : undefined,
    rate: run.n > 0 ? run.k / run.n : undefined,
    startedAt: run.startedAt.toISOString(),
    upper: interval.kind === 'rate' ? interval.upper : undefined,
  };
};
