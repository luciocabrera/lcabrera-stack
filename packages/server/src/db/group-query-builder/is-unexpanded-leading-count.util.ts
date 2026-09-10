import type { GroupAggregate } from './group-query-builder.types.ts';

export const isUnexpandedLeadingCount = (
  aggregate: GroupAggregate | undefined,
) =>
  aggregate?.fn === 'count' &&
  aggregate.column === undefined &&
  aggregate.filters === undefined;
