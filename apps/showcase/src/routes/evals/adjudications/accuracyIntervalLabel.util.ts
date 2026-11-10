import { rateFigures } from '../utils/rateFigures.util';

type AccuracyIntervalLabelArgs = {
  readonly correct: number;
  readonly scored: number;
};

export const accuracyIntervalLabel = ({
  correct,
  scored,
}: AccuracyIntervalLabelArgs) => {
  const { lower, upper } = rateFigures({ k: correct, n: scored });

  return lower === undefined || upper === undefined
    ? 'too few verdicts for an interval'
    : `${String(Math.round(lower * 100))}% to ${String(Math.round(upper * 100))}%`;
};
