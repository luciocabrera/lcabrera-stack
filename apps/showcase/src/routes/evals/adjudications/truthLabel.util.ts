import type { AdjudicationCase } from './EvalsAdjudications.types';

export const truthLabel = ({
  truth,
  truthSource,
}: Pick<AdjudicationCase, 'truth' | 'truthSource'>) =>
  truthSource === undefined ? 'none yet' : `${String(truth)} (${truthSource})`;
