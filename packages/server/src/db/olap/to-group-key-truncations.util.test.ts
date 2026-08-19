import { describe, expect, it } from 'vite-plus/test';

import type { ColumnGroupingCapability } from '../group-query-builder/group-query-builder.types.ts';

import { toGroupKeyTruncations } from './to-group-key-truncations.util.ts';

type CapabilityArgs = {
  readonly column: string;
  readonly typeName: string;
};

const capability = ({
  column,
  typeName,
}: CapabilityArgs): ColumnGroupingCapability => ({
  aggregates: ['count'],
  canGroup: true,
  column,
  periods: ['month', 'year'],
  role: 'dimension',
  typeName,
});

const CAPABILITIES = {
  order_date: capability({ column: 'order_date', typeName: 'date' }),
  order_timestamp: capability({
    column: 'order_timestamp',
    typeName: 'timestamptz',
  }),
};

describe('toGroupKeyTruncations', () => {
  it('marks a timestamptz key zoned and every other temporal key not', () => {
    // The pair the drill's boundary arithmetic branches on: a `timestamptz` is
    // truncated in UTC and read back in UTC, a `date` is truncated zone-free
    // and read back locally.
    expect(
      toGroupKeyTruncations({
        capabilities: CAPABILITIES,
        periods: { order_date: 'month', order_timestamp: 'year' },
      }),
    ).toStrictEqual({
      order_date: { isZoned: false, period: 'month' },
      order_timestamp: { isZoned: true, period: 'year' },
    });
  });

  it('answers nothing when no granularity was asked for', () => {
    expect(
      toGroupKeyTruncations({ capabilities: CAPABILITIES, periods: undefined }),
    ).toStrictEqual({});
    expect(
      toGroupKeyTruncations({ capabilities: CAPABILITIES, periods: {} }),
    ).toStrictEqual({});
  });

  it('drops a granularity whose column has no capability rather than guessing', () => {
    // Inventing `isZoned: false` would compute the range in the wrong frame for
    // exactly the request that got past the earlier refusal.
    expect(
      toGroupKeyTruncations({
        capabilities: CAPABILITIES,
        periods: { not_a_column: 'month', order_date: 'month' },
      }),
    ).toStrictEqual({ order_date: { isZoned: false, period: 'month' } });
  });
});
