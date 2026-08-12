import type {
  ColumnGroupingCapability,
  GroupAggregate,
} from './group-query-builder.types.ts';

import { assertColumnAllowed } from '../query-builder/assert-column-allowed.util.ts';
import { assertSafeIdentifier } from '../query-builder/assert-safe-identifier.util.ts';
import { MAX_COUNT_DISTINCT_AGGREGATES } from './group-query-builder.constants.ts';

type AssertGroupAggregatesArgs = {
  readonly aggregates: readonly GroupAggregate[];
  readonly allowedColumns: readonly string[];
  readonly capabilities: Readonly<Record<string, ColumnGroupingCapability>>;
};

/**
 * Legality of every requested aggregate, from the same catalogue answer the
 * group keys are checked against (ADR-058). Refusing here rather than at
 * execution is what turns `function min(jsonb) does not exist` — a 500 with a
 * Postgres error in it — into a message naming the column and the type.
 *
 * `countDistinct` is capped because it costs a per-group tuplesort that is
 * redone for every grouping set, so a second one multiplies the most expensive
 * part of the query.
 */
export const assertGroupAggregates = ({
  aggregates,
  allowedColumns,
  capabilities,
}: AssertGroupAggregatesArgs): void => {
  if (aggregates.length === 0) {
    throw new Error('A grouped query needs at least one aggregate.');
  }

  const distinctCount = aggregates.filter(
    (aggregate) => aggregate.fn === 'countDistinct',
  ).length;

  if (distinctCount > MAX_COUNT_DISTINCT_AGGREGATES) {
    throw new Error(
      `A grouped query takes at most ${MAX_COUNT_DISTINCT_AGGREGATES} countDistinct aggregate; got ${distinctCount}.`,
    );
  }

  for (const aggregate of aggregates) {
    if (aggregate.column === undefined) {
      if (aggregate.fn !== 'count') {
        throw new Error(
          `"${aggregate.fn}" needs a column; only count may be applied to every row.`,
        );
      }

      continue;
    }

    assertSafeIdentifier(aggregate.column);
    assertColumnAllowed({ allowedColumns, column: aggregate.column });

    const capability = capabilities[aggregate.column];

    if (capability === undefined) {
      throw new Error(
        `No grouping capability was resolved for column "${aggregate.column}"; it is not a column of this table, or the catalogue could not see it.`,
      );
    }

    if (!capability.aggregates.includes(aggregate.fn)) {
      const offered =
        capability.aggregates.length > 0
          ? capability.aggregates.join(', ')
          : 'none';

      throw new Error(
        `"${aggregate.fn}" is not legal for column "${aggregate.column}" (${capability.typeName}); the catalogue offers ${offered}.`,
      );
    }
  }
};
