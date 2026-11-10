import { wilson } from '@repo/eval-history/stats/wilson.util';

import { EVALS_INTERVAL } from '../constants/evalsDashboard.constants';

type AccuracyIntervalLabelArgs = {
  readonly correct: number;
  readonly scored: number;
};

export const accuracyIntervalLabel = ({
  correct,
  scored,
}: AccuracyIntervalLabelArgs) => {
  const interval = wilson({
    k: correct,
    minN: EVALS_INTERVAL.minTrialsForRate,
    n: scored,
    z: EVALS_INTERVAL.z,
  });

  return interval.kind === 'rate'
    ? `${String(Math.round(interval.lower * 100))}% to ${String(Math.round(interval.upper * 100))}%`
    : 'too few verdicts for an interval';
};
