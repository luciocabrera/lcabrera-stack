import type { DistinctEstimate } from './group-query-builder.types.ts';

import { UNIQUE_ISH_DISTINCT_RATIO } from './group-query-builder.constants.ts';

type IsUniqueIshArgs = {
  readonly estimate: DistinctEstimate;
  readonly relTuples: number;
};

export const isUniqueIsh = ({ estimate, relTuples }: IsUniqueIshArgs) =>
  estimate.kind === 'known' &&
  relTuples > 0 &&
  estimate.value >= relTuples * UNIQUE_ISH_DISTINCT_RATIO;
