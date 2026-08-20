import { describe, expect, it } from 'vite-plus/test';

import type { TableColumnAggregate } from '#ui/components/Table/Table.types';

import { deriveAggregateCommandState } from './deriveAggregateCommandState.util';

const applied: readonly TableColumnAggregate[] = [
  { columnKey: 'total_amount', fn: 'sum' },
  { columnKey: 'total_amount', fn: 'avg' },
  { columnKey: 'quantity', fn: 'count' },
];

describe('deriveAggregateCommandState', () => {
  it('is active for a function applied to the column', () => {
    expect(
      deriveAggregateCommandState({
        applied,
        columnKey: 'total_amount',
        isDisabled: false,
        target: 'sum',
      }).isActive,
    ).toBe(true);
  });

  it('is active for SEVERAL functions on one column at once', () => {
    // The whole reason this exists beside `deriveToggleCommandState`: a toggle
    // can only ever report one active target, so this case is the one the shared
    // helper cannot express.
    expect(
      ['sum', 'avg'].map(
        (fn) =>
          deriveAggregateCommandState({
            applied,
            columnKey: 'total_amount',
            isDisabled: false,
            target: fn as 'avg' | 'sum',
          }).isActive,
      ),
    ).toStrictEqual([true, true]);
  });

  it('is inactive for a function applied to a different column', () => {
    expect(
      deriveAggregateCommandState({
        applied,
        columnKey: 'total_amount',
        isDisabled: false,
        target: 'count',
      }).isActive,
    ).toBe(false);
  });

  it('is never active for the clear command', () => {
    expect(
      deriveAggregateCommandState({
        applied,
        columnKey: 'total_amount',
        isDisabled: false,
        target: undefined,
      }).isActive,
    ).toBe(false);
  });

  it('enables the clear command while the column carries anything', () => {
    expect(
      deriveAggregateCommandState({
        applied,
        columnKey: 'total_amount',
        isDisabled: false,
        target: undefined,
      }).isEnabled,
    ).toBe(true);
  });

  it('disables the clear command on a column carrying nothing', () => {
    expect(
      deriveAggregateCommandState({
        applied,
        columnKey: 'order_status',
        isDisabled: false,
        target: undefined,
      }).isEnabled,
    ).toBe(false);
  });

  it('honours the capability flag whatever the target', () => {
    expect(
      deriveAggregateCommandState({
        applied,
        columnKey: 'total_amount',
        isDisabled: true,
        target: 'sum',
      }).isEnabled,
    ).toBe(false);
  });

  it('enables an unapplied function so it can be added', () => {
    expect(
      deriveAggregateCommandState({
        applied,
        columnKey: 'total_amount',
        isDisabled: false,
        target: 'min',
      }),
    ).toStrictEqual({ isActive: false, isEnabled: true });
  });
});
