import type { RunFigures } from '../types/runFigures.types';

export const intervalLabel = ({
  lower,
  upper,
}: Pick<RunFigures, 'lower' | 'upper'>) =>
  lower === undefined || upper === undefined
    ? 'too few trials for an interval'
    : `${String(Math.round(lower * 100))}% to ${String(Math.round(upper * 100))}%`;
