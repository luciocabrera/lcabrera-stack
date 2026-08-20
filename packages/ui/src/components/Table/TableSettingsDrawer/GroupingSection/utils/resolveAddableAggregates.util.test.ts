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

/** A dimension the catalogue offers both count flavours on. */
const textCapability: TableColumnGroupingCapability = {
  aggregates: ['count', 'countDistinct', 'max', 'min'],
  canGroup: true,
  column: 'order_status',
  periods: [],
  role: 'dimension',
  typeName: 'text',
};

/** The same column narrowed to the two counts, so both gaps are reachable. */
const countOnlyCapability: TableColumnGroupingCapability = {
  ...textCapability,
  aggregates: ['count', 'countDistinct'],
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
      gap: undefined,
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
    ).toStrictEqual({ gap: 'column-exhausted', options: [] });
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
    ).toStrictEqual({ gap: undefined, options: [] });
  });

  it('does not call an empty list exhausted while the column is a group key', () => {
    expect(
      resolveAddableAggregates({
        applied: [],
        capability: numericCapability,
        columnKey: 'total_amount',
        isGroupKey: true,
      }),
    ).toStrictEqual({ gap: undefined, options: [] });
  });

  it('does not call an empty list exhausted while no column is chosen', () => {
    expect(
      resolveAddableAggregates({
        applied: [{ columnKey: 'total_amount', fn: 'sum' }],
        capability: undefined,
        columnKey: '',
        isGroupKey: false,
      }),
    ).toStrictEqual({ gap: undefined, options: [] });
  });

  it('omits a second distinct count while another column carries one', () => {
    expect(
      resolveAddableAggregates({
        applied: [{ columnKey: 'shipped_city', fn: 'countDistinct' }],
        capability: textCapability,
        columnKey: 'order_status',
        isGroupKey: false,
      }).options.map(({ value }) => value),
    ).toStrictEqual(['count', 'min', 'max']);
  });

  it('offers it again once that distinct count is cleared', () => {
    expect(
      resolveAddableAggregates({
        applied: [{ columnKey: 'shipped_city', fn: 'count' }],
        capability: textCapability,
        columnKey: 'order_status',
        isGroupKey: false,
      }).options.map(({ value }) => value),
    ).toStrictEqual(['count', 'countDistinct', 'min', 'max']);
  });

  it('reports the budget, not exhaustion, when that is what emptied the list', () => {
    // Both gaps are reachable here and they send the user to different
    // controls: this column is not fully measured — `countDistinct` is still
    // legal on it — and the measure to remove is on another column entirely
    // (#842).
    expect(
      resolveAddableAggregates({
        applied: [
          { columnKey: 'shipped_city', fn: 'countDistinct' },
          { columnKey: 'order_status', fn: 'count' },
        ],
        capability: countOnlyCapability,
        columnKey: 'order_status',
        isGroupKey: false,
      }),
    ).toStrictEqual({ gap: 'count-distinct-spent', options: [] });
  });

  it('reports exhaustion when the column itself carries the distinct count', () => {
    // The discriminating half: the same empty list, and the budget is spent —
    // by this column. Nothing is withheld from it, so the answer is the #841
    // message and the user is sent to this column's own measures.
    expect(
      resolveAddableAggregates({
        applied: [
          { columnKey: 'order_status', fn: 'count' },
          { columnKey: 'order_status', fn: 'countDistinct' },
        ],
        capability: countOnlyCapability,
        columnKey: 'order_status',
        isGroupKey: false,
      }),
    ).toStrictEqual({ gap: 'column-exhausted', options: [] });
  });

  it('stays silent when the column was never offered a distinct count', () => {
    // A column with nothing withheld has nothing to explain, so a spent budget
    // elsewhere does not turn its ordinary exhaustion into the wrong message.
    expect(
      resolveAddableAggregates({
        applied: [
          { columnKey: 'shipped_city', fn: 'countDistinct' },
          { columnKey: 'total_amount', fn: 'avg' },
          { columnKey: 'total_amount', fn: 'count' },
          { columnKey: 'total_amount', fn: 'sum' },
        ],
        capability: numericCapability,
        columnKey: 'total_amount',
        isGroupKey: false,
      }),
    ).toStrictEqual({ gap: 'column-exhausted', options: [] });
  });
});
