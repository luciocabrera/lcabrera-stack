import type {
  GroupCardinalityEstimate,
  GroupRowLimit,
} from './group-query-builder.types.ts';

import { MAX_GROUP_ROWS_WARN } from './group-query-builder.constants.ts';

type ResolveGroupRowLimitArgs = {
  readonly estimate: GroupCardinalityEstimate;
  readonly maxRows: number;
};

export const resolveGroupRowLimit = ({
  estimate,
  maxRows,
}: ResolveGroupRowLimitArgs): GroupRowLimit => {
  const backstopAt = MAX_GROUP_ROWS_WARN + 1;

  return estimate.kind === 'known' || maxRows < backstopAt
    ? { limit: maxRows }
    : { backstopAt, limit: backstopAt };
};
