import { OLAP_GROUP_ROW_FIELD } from '@lcabrera/api/olap/olap.constants';
import { describe, expect, it } from 'vite-plus/test';

import type { BuiltGroupAggregate } from '../group-query-builder/group-query-builder.types';

import {
  decodeGroupedRows,
  toGroupAggregates,
  toGroupSort,
} from './decode-grouped-rows.util';

const REQUESTED = [
  { column: 'amount', fn: 'sum' },
  { column: 'quantity', fn: 'avg' },
] as const;

const alias = (aggregate: { readonly column?: string; readonly fn: string }) =>
  aggregate.column === undefined
    ? `${aggregate.fn}_all`
    : `${aggregate.fn}_${aggregate.column}`;

const emit = (
  requested: readonly { readonly column?: string; readonly fn: string }[],
): readonly BuiltGroupAggregate[] =>
  requested.map(
    (aggregate) =>
      ({ alias: alias(aggregate), ...aggregate }) as BuiltGroupAggregate,
  );

describe('toGroupAggregates', () => {
  it('asks for count(*) first, then the route’s own, in order', () => {
    expect(toGroupAggregates({ requested: REQUESTED })).toStrictEqual([
      { fn: 'count' },
      { column: 'amount', fn: 'sum' },
      { column: 'quantity', fn: 'avg' },
    ]);
  });

  it('asks for count(*) even when nothing else was selected', () => {
    expect(toGroupAggregates({ requested: [] })).toStrictEqual([
      { fn: 'count' },
    ]);
  });
});

describe('decodeGroupedRows', () => {
  it('lands each aggregate on the column that asked for it', () => {
    const built = emit(toGroupAggregates({ requested: REQUESTED }));
    const [decoded] = decodeGroupedRows({
      aggregates: built,
      columnKeys: ['status'],
      maskAlias: 'grouping_mask',
      requested: REQUESTED,
      rows: [
        {
          avg_quantity: 7,
          count_all: '42',
          grouping_mask: 0,
          status: 'Cancelled',
          sum_amount: 1000,
        },
      ],
    });

    const summary = decoded?.[OLAP_GROUP_ROW_FIELD];

    expect(summary?.count).toBe(42);
    expect(summary?.aggregates).toStrictEqual([
      { columnKey: 'amount', fn: 'sum', value: 1000 },
      { columnKey: 'quantity', fn: 'avg', value: 7 },
    ]);
  });

  it('keeps two aggregates over ONE column apart', () => {
    const requested = [
      { column: 'amount', fn: 'sum' },
      { column: 'amount', fn: 'avg' },
    ] as const;
    const built = emit(toGroupAggregates({ requested }));

    expect(built.map((aggregate) => aggregate.alias)).toStrictEqual([
      'count_all',
      'sum_amount',
      'avg_amount',
    ]);

    const [decoded] = decodeGroupedRows({
      aggregates: built,
      columnKeys: ['status'],
      maskAlias: 'grouping_mask',
      requested,
      rows: [
        {
          avg_amount: 250,
          count_all: '4',
          grouping_mask: 0,
          status: 'Shipped',
          sum_amount: 1000,
        },
      ],
    });

    expect(decoded?.[OLAP_GROUP_ROW_FIELD]?.aggregates).toStrictEqual([
      { columnKey: 'amount', fn: 'sum', value: 1000 },
      { columnKey: 'amount', fn: 'avg', value: 250 },
    ]);
  });

  it('decodes a read that selected no aggregate but still counts', () => {
    const built = emit(toGroupAggregates({ requested: [] }));
    const [decoded] = decodeGroupedRows({
      aggregates: built,
      columnKeys: ['status'],
      maskAlias: 'grouping_mask',
      requested: [],
      rows: [{ count_all: '3', grouping_mask: 0, status: 'Cancelled' }],
    });

    expect(decoded?.[OLAP_GROUP_ROW_FIELD]?.count).toBe(3);
    expect(decoded?.[OLAP_GROUP_ROW_FIELD]?.aggregates).toStrictEqual([]);
  });

  it('throws rather than decoding a list that does not line up', () => {
    expect(() =>
      decodeGroupedRows({
        aggregates: emit(toGroupAggregates({ requested: [] })),
        columnKeys: ['status'],
        maskAlias: 'grouping_mask',
        requested: REQUESTED,
        rows: [{ count_all: '1', grouping_mask: 0, status: 'A' }],
      }),
    ).toThrow(/aggregate alias/);
  });

  it('throws when the read emitted no aggregates at all', () => {
    expect(() =>
      decodeGroupedRows({
        aggregates: [],
        columnKeys: ['status'],
        maskAlias: 'grouping_mask',
        requested: [],
        rows: [{ count_all: '1', grouping_mask: 0, status: 'A' }],
      }),
    ).toThrow(/aggregate alias/);
  });

  it('throws on a list of the right length in the wrong order', () => {
    const built = emit(toGroupAggregates({ requested: REQUESTED }));

    expect(() =>
      decodeGroupedRows({
        aggregates: built,
        columnKeys: ['status'],
        maskAlias: 'grouping_mask',
        requested: [REQUESTED[1], REQUESTED[0]],
        rows: [
          {
            avg_quantity: 7,
            count_all: '42',
            grouping_mask: 0,
            status: 'Cancelled',
            sum_amount: 1000,
          },
        ],
      }),
    ).toThrow(/ordered differently/);
  });

  it('throws when the first projection is not count(*)', () => {
    expect(() =>
      decodeGroupedRows({
        aggregates: emit(REQUESTED),
        columnKeys: ['status'],
        maskAlias: 'grouping_mask',
        requested: [REQUESTED[1]],
        rows: [{ avg_quantity: 7, grouping_mask: 0, status: 'Cancelled' }],
      }),
    ).toThrow(/not `count\(\*\)`/);
  });

  it('returns one decoded row per row read', () => {
    const built = emit(toGroupAggregates({ requested: [] }));

    expect(
      decodeGroupedRows({
        aggregates: built,
        columnKeys: ['status'],
        maskAlias: 'grouping_mask',
        requested: [],
        rows: [
          { count_all: '1', grouping_mask: 0, status: 'A' },
          { count_all: '2', grouping_mask: 0, status: 'B' },
        ],
      }),
    ).toHaveLength(2);
  });
});

describe('toGroupSort', () => {
  it('turns a sort on a measure column into an aggregate term, after the keys', () => {
    expect(
      toGroupSort({
        groupKeys: ['status'],
        requested: REQUESTED,
        sort: [{ column: 'amount:sum', direction: 'desc' }],
      }),
    ).toStrictEqual([
      { direction: 'asc', key: 'status' },
      { aggregateAlias: 'sum_amount', direction: 'desc' },
    ]);
  });

  it('derives the alias with the builder’s own rule', () => {
    expect(
      toGroupSort({
        groupKeys: [],
        requested: REQUESTED,
        sort: [{ column: 'quantity:avg', direction: 'asc' }],
      }),
    ).toStrictEqual([{ aggregateAlias: 'avg_quantity', direction: 'asc' }]);
  });

  it('drops a measure sort naming an aggregate this read did not request', () => {
    expect(
      toGroupSort({
        groupKeys: ['status'],
        requested: REQUESTED,
        sort: [{ column: 'amount:avg', direction: 'desc' }],
      }),
    ).toStrictEqual([{ direction: 'asc', key: 'status' }]);
  });

  it('keeps a plain column sort dropped even when aggregates are requested', () => {
    expect(
      toGroupSort({
        groupKeys: ['status'],
        requested: REQUESTED,
        sort: [{ column: 'amount', direction: 'desc' }],
      }),
    ).toStrictEqual([{ direction: 'asc', key: 'status' }]);
  });

  it('emits one term per key, in nesting order', () => {
    expect(
      toGroupSort({
        groupKeys: ['status', 'priority'],
        sort: [{ column: 'priority', direction: 'desc' }],
      }),
    ).toStrictEqual([
      { direction: 'asc', key: 'status' },
      { direction: 'desc', key: 'priority' },
    ]);
  });

  it('drops a sort on a column the grouped result has no values of', () => {
    expect(
      toGroupSort({
        groupKeys: ['status'],
        sort: [{ column: 'orderNumber', direction: 'desc' }],
      }),
    ).toStrictEqual([{ direction: 'asc', key: 'status' }]);
  });

  it('emits nothing when nothing is grouped', () => {
    expect(
      toGroupSort({
        groupKeys: [],
        sort: [{ column: 'status', direction: 'desc' }],
      }),
    ).toStrictEqual([]);
  });
});
