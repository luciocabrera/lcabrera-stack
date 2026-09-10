import type {
  BuiltGroupAggregate,
  GroupAggregate,
  GroupSort,
} from '../group-query-builder/group-query-builder.types';
import type { QuerySort } from '../query-builder/query-builder.types';
import type { GroupKeyTruncation, RequestedGroupAggregate } from './olap.types';

import { resolveAggregateAlias } from '../group-query-builder/resolve-aggregate-alias.util';
import { decodeAxisAggregates } from './decode-axis-aggregates.util';
import { decodeRequestedAggregates } from './decode-requested-aggregates.util';
import { isUnexpandedCount } from './is-unexpanded-count.util';
import { toGroupRow } from './to-group-row.util';

export type { RequestedGroupAggregate } from './olap.types';

type DecodeGroupedRowsArgs = {
  readonly aggregates: readonly BuiltGroupAggregate[];
  readonly columnAxis?: { readonly values: readonly unknown[] };
  readonly columnKeys: readonly string[];
  readonly maskAlias: string;
  readonly requested: readonly RequestedGroupAggregate[];
  readonly rows: readonly Record<string, unknown>[];
  readonly truncations?: Readonly<Record<string, GroupKeyTruncation>>;
};

type ToGroupSortArgs = {
  readonly groupKeys: readonly string[];
  readonly requested?: readonly RequestedGroupAggregate[];
  readonly sort: readonly QuerySort[];
};

export const toGroupAggregates = ({
  requested,
}: {
  readonly requested: readonly RequestedGroupAggregate[];
}): readonly GroupAggregate[] => [{ fn: 'count' }, ...requested];

export const decodeGroupedRows = ({
  aggregates,
  columnAxis,
  columnKeys,
  maskAlias,
  requested,
  rows,
  truncations,
}: DecodeGroupedRowsArgs) => {
  const isWide =
    columnAxis !== undefined ||
    aggregates.some((aggregate) => aggregate.axis !== undefined);

  if (aggregates.length === 0) {
    if (requested.length > 0) {
      throw new Error(
        `Grouped read emitted ${String(aggregates.length)} aggregate alias(es) but ${String(requested.length + 1)} were requested (count(*) plus ${String(requested.length)}); pass the same list \`toGroupAggregates\` was given.`,
      );
    }

    return rows.map((row) =>
      toGroupRow({
        aggregates: [],
        columnKeys,
        countAlias: '',
        maskAlias,
        row,
        truncations,
      }),
    );
  }

  const count = aggregates.find((aggregate) => isUnexpandedCount(aggregate));
  const selected = aggregates.filter((aggregate) => aggregate !== count);

  if (!isWide) {
    if (count === undefined) {
      throw new Error(
        `Grouped read projected \`${aggregates[0]?.fn ?? '*'}\` first, not \`count(*)\`; the aggregate list was not built by \`toGroupAggregates\`.`,
      );
    }

    const decoded = decodeRequestedAggregates({ requested, selected });

    return rows.map((row) =>
      toGroupRow({
        aggregates: decoded,
        columnKeys,
        countAlias: count.alias,
        maskAlias,
        row,
        truncations,
      }),
    );
  }

  const decoded = decodeAxisAggregates({ requested, selected });

  return rows.map((row) =>
    toGroupRow({
      aggregates: decoded,
      columnKeys,
      countAlias: count?.alias ?? '',
      maskAlias,
      row,
      truncations,
    }),
  );
};

const toAggregateSortKey = ({ column, fn }: RequestedGroupAggregate) =>
  `${column}:${fn}`;

export const toGroupSort = ({
  groupKeys,
  requested = [],
  sort,
}: ToGroupSortArgs): readonly GroupSort[] => {
  const keyTerms: GroupSort[] = groupKeys.map((key) => ({
    direction: sort.find((entry) => entry.column === key)?.direction ?? 'asc',
    key,
  }));

  const aggregateTerms = sort.flatMap((entry) => {
    const measure = requested.find(
      (aggregate) => toAggregateSortKey(aggregate) === entry.column,
    );

    return measure === undefined
      ? []
      : [
          {
            aggregateAlias: resolveAggregateAlias(measure),
            direction: entry.direction,
          },
        ];
  });

  return [...keyTerms, ...aggregateTerms];
};
