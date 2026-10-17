import { wilson } from '@repo/eval-history/stats/wilson.util';

import { EVALS_INTERVAL } from '../constants/evalsDashboard.constants';

type RateFiguresArgs = {
  readonly k: number;
  readonly n: number;
};

export const rateFigures = ({ k, n }: RateFiguresArgs) => {
  const interval = wilson({
    k,
    minN: EVALS_INTERVAL.minTrialsForRate,
    n,
    z: EVALS_INTERVAL.z,
  });

  return {
    k,
    lower: interval.kind === 'rate' ? interval.lower : undefined,
    n,
    rate: n > 0 ? k / n : undefined,
    upper: interval.kind === 'rate' ? interval.upper : undefined,
  };
};
