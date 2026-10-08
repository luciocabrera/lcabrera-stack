import type { RunFigures } from '../types/runFigures.types';

export const passRateLabel = ({
  k,
  n,
  rate,
}: Pick<RunFigures, 'k' | 'n' | 'rate'>) =>
  rate === undefined
    ? 'no scored trials'
    : `${String(Math.round(rate * 100))}% (${String(k)}/${String(n)})`;
