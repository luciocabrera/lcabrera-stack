import type {
  AggregateFn,
  BuiltGroupAggregate,
  GroupAggregate,
  GroupSort,
} from '../group-query-builder/group-query-builder.types';
import type { QuerySort } from '../query-builder/query-builder.types';
import type { GroupKeyTruncation } from './olap.types';

import { resolveAggregateAlias } from '../group-query-builder/resolve-aggregate-alias.util';
import { toGroupRow } from './to-group-row.util';

export type RequestedGroupAggregate = {
  readonly column: string;
  readonly fn: AggregateFn;
};

type DecodeGroupedRowsArgs = {
  readonly aggregates: readonly BuiltGroupAggregate[];
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
  columnKeys,
  maskAlias,
  requested,
  rows,
  truncations,
}: DecodeGroupedRowsArgs) => {
  const [count, ...selected] = aggregates;

  if (count === undefined || selected.length !== requested.length) {
    throw new Error(
      `Grouped read emitted ${String(aggregates.length)} aggregate alias(es) but ${String(requested.length + 1)} were requested (count(*) plus ${String(requested.length)}); pass the same list \`toGroupAggregates\` was given.`,
    );
  }

  if (count.fn !== 'count' || count.column !== undefined) {
    throw new Error(
      `Grouped read projected \`${count.fn}\` first, not \`count(*)\`; the aggregate list was not built by \`toGroupAggregates\`.`,
    );
  }

  const decoded = requested.map((aggregate, index) => {
    const emitted = selected[index] ?? count;

    if (emitted.fn !== aggregate.fn || emitted.column !== aggregate.column) {
      throw new Error(
        `Grouped read projected \`${emitted.fn}\` on \`${emitted.column ?? '*'}\` at position ${String(index + 1)} but \`${aggregate.fn}\` on \`${aggregate.column}\` was requested there; the two lists are ordered differently.`,
      );
    }

    return {
      alias: emitted.alias,
      columnKey: aggregate.column,
      fn: aggregate.fn,
    };
  });

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
