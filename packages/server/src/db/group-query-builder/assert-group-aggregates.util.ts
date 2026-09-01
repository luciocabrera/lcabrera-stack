import type {
  ColumnGroupingCapability,
  GroupAggregate,
} from './group-query-builder.types.ts';

import { GroupingRefusedError } from '../../errors/grouping-refused.error.ts';
import { assertGroupColumn } from './assert-group-column.util.ts';
import { MAX_COUNT_DISTINCT_AGGREGATES } from './group-query-builder.constants.ts';

type AssertGroupAggregatesArgs = {
  readonly aggregates: readonly GroupAggregate[];
  readonly allowedColumns: readonly string[];
  readonly capabilities: Readonly<Record<string, ColumnGroupingCapability>>;
};

export const assertGroupAggregates = ({
  aggregates,
  allowedColumns,
  capabilities,
}: AssertGroupAggregatesArgs) => {
  if (aggregates.length === 0) {
    throw new GroupingRefusedError({
      message: 'A grouped query needs at least one aggregate.',
      reason: 'aggregate-not-legal',
    });
  }

  const distinctCount = aggregates.filter(
    (aggregate) => aggregate.fn === 'countDistinct',
  ).length;

  if (distinctCount > MAX_COUNT_DISTINCT_AGGREGATES) {
    throw new GroupingRefusedError({
      message: `A grouped query takes at most ${MAX_COUNT_DISTINCT_AGGREGATES} countDistinct aggregate; got ${distinctCount}.`,
      reason: 'aggregate-not-legal',
    });
  }

  for (const aggregate of aggregates) {
    if (aggregate.column === undefined) {
      if (aggregate.fn !== 'count') {
        throw new GroupingRefusedError({
          message: `"${aggregate.fn}" needs a column; only count may be applied to every row.`,
          reason: 'aggregate-not-legal',
        });
      }

      continue;
    }

    assertGroupColumn({ allowedColumns, column: aggregate.column });

    const capability = capabilities[aggregate.column];

    if (capability === undefined) {
      throw new GroupingRefusedError({
        column: aggregate.column,
        message: `No grouping capability was resolved for column "${aggregate.column}"; it is not a column of this table, or the catalogue could not see it.`,
        reason: 'unknown-column',
      });
    }

    if (!capability.aggregates.includes(aggregate.fn)) {
      const offered =
        capability.aggregates.length > 0
          ? capability.aggregates.join(', ')
          : 'none';

      throw new GroupingRefusedError({
        column: aggregate.column,
        message: `"${aggregate.fn}" is not legal for column "${aggregate.column}" (${capability.typeName}); the catalogue offers ${offered}.`,
        reason: 'aggregate-not-legal',
      });
    }
  }
};
