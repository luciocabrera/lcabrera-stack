import { POSTGRES_MAX_HEAP_ATTRIBUTES } from './group-query-builder.constants.ts';

type ToColumnAxisDiscoveryLimitArgs = {
  readonly fixedAggregateCount?: number;
  readonly keyCount: number;
  readonly maxDistinct: number;
  readonly measureCount: number;
};

export const toColumnAxisDiscoveryLimit = ({
  fixedAggregateCount = 0,
  keyCount,
  maxDistinct,
  measureCount,
}: ToColumnAxisDiscoveryLimitArgs) => {
  const maxByHeap =
    measureCount < 1
      ? maxDistinct
      : Math.floor(
          (POSTGRES_MAX_HEAP_ATTRIBUTES - keyCount - 1 - fixedAggregateCount) /
            measureCount,
        );

  return Math.min(maxDistinct, Math.max(maxByHeap, 0)) + 1;
};
