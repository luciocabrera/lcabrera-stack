import type { RunFigures } from '../types/runFigures.types';

type Interval = Pick<RunFigures, 'lower' | 'upper'>;

type IntervalChangeArgs = {
  readonly a: Interval;
  readonly b: Interval;
};

export const intervalChange = ({ a, b }: IntervalChangeArgs) => {
  if (
    a.lower === undefined ||
    a.upper === undefined ||
    b.lower === undefined ||
    b.upper === undefined
  ) {
    return 'too few trials to compare';
  }

  if (b.upper < a.lower) {
    return 'B is below A';
  }

  return b.lower > a.upper ? 'B is above A' : 'overlapping';
};
