import type { GroupAggregate } from './group-query-builder.types.ts';

import { isUnexpandedLeadingCount } from './is-unexpanded-leading-count.util.ts';

export const toExpandingMeasureCount = (
  aggregates: readonly GroupAggregate[],
) =>
  isUnexpandedLeadingCount(aggregates[0])
    ? Math.max(0, aggregates.length - 1)
    : aggregates.length;
