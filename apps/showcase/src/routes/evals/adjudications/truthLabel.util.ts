import type { AdjudicationCase } from './EvalsAdjudications.types';

export const truthLabel = ({
  truth,
  truthSource,
}: Pick<AdjudicationCase, 'truth' | 'truthSource'>) =>
  truth === undefined || truthSource === undefined
    ? 'none yet'
    : `${truth} (${truthSource})`;
