import type { DistinctEstimate } from './group-query-builder.types.ts';

import { UNIQUE_ISH_DISTINCT_RATIO } from './group-query-builder.constants.ts';

type IsUniqueIshArgs = {
  readonly estimate: DistinctEstimate;
  readonly relTuples: number;
};

/**
 * Grouping by one produces a "group" per row, which is the likeliest user mistake and the
 * one worth its own refusal message.
 * Refusing on absent statistics would make grouping dead on a freshly restored database;
 * the fact-column rule handles the case where that guess is genuinely unaffordable.
 */
export const isUniqueIsh = ({ estimate, relTuples }: IsUniqueIshArgs) =>
  estimate.kind === 'known' &&
  relTuples > 0 &&
  estimate.value >= relTuples * UNIQUE_ISH_DISTINCT_RATIO;
