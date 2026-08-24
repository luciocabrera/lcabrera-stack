import type {
  GroupCardinalityEstimate,
  GroupRowLimit,
} from './group-query-builder.types.ts';

import { MAX_GROUP_ROWS_WARN } from './group-query-builder.constants.ts';

type ResolveGroupRowLimitArgs = {
  readonly estimate: GroupCardinalityEstimate;
  readonly maxRows: number;
};

/**
 * Without one, the read is capped at the warn threshold plus one and that cap is marked as
 * a backstop: one extra row over the budget is all it takes to prove the result was too
 * large, and there is no cheaper way to learn it when the statistics could not say so up
 * front (ADR-066).
 * A caller asking for **fewer** rows than the backstop keeps its own number and gets no
 * backstop: reaching a limit it chose is truncation it asked for, not evidence of
 * anything.
 */
export const resolveGroupRowLimit = ({
  estimate,
  maxRows,
}: ResolveGroupRowLimitArgs): GroupRowLimit => {
  const backstopAt = MAX_GROUP_ROWS_WARN + 1;

  return estimate.kind === 'known' || maxRows < backstopAt
    ? { limit: maxRows }
    : { backstopAt, limit: backstopAt };
};
