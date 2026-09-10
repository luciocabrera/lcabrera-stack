import type { QueryFilter } from '../query-builder/query-builder.types.ts';
import type { GroupAggregate } from './group-query-builder.types.ts';

import { resolveAggregateAlias } from './resolve-aggregate-alias.util.ts';
import { toColumnAxisAlias } from './to-column-axis-alias.util.ts';

export type ExpandedColumnAxisAggregate = GroupAggregate & {
  readonly alias: string;
  readonly axisValue: unknown;
};

type ColumnAxisValue = {
  readonly key: string;
  readonly values: readonly unknown[];
};

type ExpandColumnAxisAggregatesArgs = {
  readonly aggregates: readonly GroupAggregate[];
  readonly columnAxis: ColumnAxisValue;
};

const toAxisFilter = ({
  key,
  value,
}: {
  readonly key: string;
  readonly value: unknown;
}): QueryFilter =>
  value === null || value === undefined
    ? { column: key, operator: 'isNull' }
    : { column: key, operator: 'eq', value };

export const expandColumnAxisAggregates = ({
  aggregates,
  columnAxis,
}: ExpandColumnAxisAggregatesArgs) =>
  columnAxis.values.flatMap((axisValue, index) =>
    aggregates.map((aggregate) => {
      const alias = toColumnAxisAlias({
        alias: resolveAggregateAlias(aggregate),
        index,
      });

      return {
        ...aggregate,
        alias,
        axisValue,
        filters: [
          ...(aggregate.filters ?? []),
          toAxisFilter({ key: columnAxis.key, value: axisValue }),
        ],
      } satisfies ExpandedColumnAxisAggregate;
    }),
  );
