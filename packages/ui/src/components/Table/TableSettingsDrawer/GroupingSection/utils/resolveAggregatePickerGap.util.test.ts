import { describe, expect, it } from 'vite-plus/test';

import type { TableAggregateFn } from '#ui/components/Table/Table.types';

import { resolveAggregatePickerGap } from './resolveAggregatePickerGap.util';

const NONE: readonly TableAggregateFn[] = [];

describe('resolveAggregatePickerGap', () => {
  it('reports no gap while the picker has something to offer', () => {
    expect(
      resolveAggregatePickerGap({
        affordable: ['count', 'sum'],
        appliedFns: new Set<TableAggregateFn>(['count']),
        hasOptions: true,
        withheld: NONE,
      }),
    ).toBeUndefined();
  });

  it('reports the budget when a withheld function could have been added', () => {
    expect(
      resolveAggregatePickerGap({
        affordable: ['count'],
        appliedFns: new Set<TableAggregateFn>(['count']),
        hasOptions: false,
        withheld: ['countDistinct'],
      }),
    ).toBe('count-distinct-spent');
  });

  it('reports exhaustion when the withheld function is one the column carries', () => {
    expect(
      resolveAggregatePickerGap({
        affordable: ['count', 'countDistinct'],
        appliedFns: new Set<TableAggregateFn>(['count', 'countDistinct']),
        hasOptions: false,
        withheld: ['countDistinct'],
      }),
    ).toBe('column-exhausted');
  });

  it('prefers the budget over exhaustion when both could describe the empty list', () => {
    expect(
      resolveAggregatePickerGap({
        affordable: ['count'],
        appliedFns: new Set<TableAggregateFn>(['count']),
        hasOptions: false,
        withheld: ['countDistinct'],
      }),
    ).toBe('count-distinct-spent');
  });

  it('reports exhaustion when every affordable function is applied', () => {
    expect(
      resolveAggregatePickerGap({
        affordable: ['count', 'sum'],
        appliedFns: new Set<TableAggregateFn>(['count', 'sum']),
        hasOptions: false,
        withheld: NONE,
      }),
    ).toBe('column-exhausted');
  });

  it('reports nothing when there was never anything to offer', () => {
    expect(
      resolveAggregatePickerGap({
        affordable: NONE,
        appliedFns: new Set<TableAggregateFn>(),
        hasOptions: false,
        withheld: NONE,
      }),
    ).toBeUndefined();
  });
});
