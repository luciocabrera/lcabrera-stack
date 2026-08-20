import { describe, expect, it } from 'vite-plus/test';

import type { TableColumnGroupingCapability } from '#ui/components/Table/Table.types';

import { resolveAddableAggregates } from './resolveAddableAggregates.util';

const numericCapability: TableColumnGroupingCapability = {
  aggregates: ['avg', 'count', 'sum'],
  canGroup: false,
  column: 'total_amount',
  periods: [],
  refusal: 'too-many-distinct',
  role: 'fact',
  typeName: 'numeric',
};

const unsupportedCapability: TableColumnGroupingCapability = {
  aggregates: [],
  canGroup: false,
  column: 'doc',
  periods: [],
  refusal: 'not-a-dimension',
  role: 'unsupported',
  typeName: 'jsonb',
};

describe('resolveAddableAggregates', () => {
  it('offers every legal function while the column carries none', () => {
    expect(
      resolveAddableAggregates({
        applied: [],
        capability: numericCapability,
        columnKey: 'total_amount',
        isGroupKey: false,
      }),
    ).toStrictEqual({
      isExhausted: false,
      options: [
        { label: 'Count', value: 'count' },
        { label: 'Sum', value: 'sum' },
        { label: 'Average', value: 'avg' },
      ],
    });
  });

  it('omits a function the column already carries', () => {
    expect(
      resolveAddableAggregates({
        applied: [{ columnKey: 'total_amount', fn: 'avg' }],
        capability: numericCapability,
        columnKey: 'total_amount',
        isGroupKey: false,
      }).options.map(({ value }) => value),
    ).toStrictEqual(['count', 'sum']);
  });

  it('offers the function again once it is no longer applied', () => {
    // Clearing the aggregate is the only thing that changes between this and
    // the case above, so the omission cannot be anything but the subtraction.
    expect(
      resolveAddableAggregates({
        applied: [{ columnKey: 'total_amount', fn: 'count' }],
        capability: numericCapability,
        columnKey: 'total_amount',
        isGroupKey: false,
      }).options.map(({ value }) => value),
    ).toStrictEqual(['sum', 'avg']);
  });

  it('subtracts only the aggregates applied to *this* column', () => {
    // A column key repeats across the staged list (#831), so a subtraction that
    // ignored the column would empty a picker on the strength of another one.
    expect(
      resolveAddableAggregates({
        applied: [
          { columnKey: 'order_status', fn: 'count' },
          { columnKey: 'shipped_at', fn: 'sum' },
        ],
        capability: numericCapability,
        columnKey: 'total_amount',
        isGroupKey: false,
      }).options.map(({ value }) => value),
    ).toStrictEqual(['count', 'sum', 'avg']);
  });

  it('reports exhaustion once every legal function is applied', () => {
    expect(
      resolveAddableAggregates({
        applied: [
          { columnKey: 'total_amount', fn: 'avg' },
          { columnKey: 'total_amount', fn: 'count' },
          { columnKey: 'total_amount', fn: 'sum' },
        ],
        capability: numericCapability,
        columnKey: 'total_amount',
        isGroupKey: false,
      }),
    ).toStrictEqual({ isExhausted: true, options: [] });
  });

  it('does not call an empty list exhausted when nothing was legal', () => {
    // The discriminating half of the pair above: both answer with no options,
    // and only one of them has a reason worth showing the user.
    expect(
      resolveAddableAggregates({
        applied: [],
        capability: unsupportedCapability,
        columnKey: 'doc',
        isGroupKey: false,
      }),
    ).toStrictEqual({ isExhausted: false, options: [] });
  });

  it('does not call an empty list exhausted while the column is a group key', () => {
    expect(
      resolveAddableAggregates({
        applied: [],
        capability: numericCapability,
        columnKey: 'total_amount',
        isGroupKey: true,
      }),
    ).toStrictEqual({ isExhausted: false, options: [] });
  });

  it('does not call an empty list exhausted while no column is chosen', () => {
    expect(
      resolveAddableAggregates({
        applied: [{ columnKey: 'total_amount', fn: 'sum' }],
        capability: undefined,
        columnKey: '',
        isGroupKey: false,
      }),
    ).toStrictEqual({ isExhausted: false, options: [] });
  });
});
