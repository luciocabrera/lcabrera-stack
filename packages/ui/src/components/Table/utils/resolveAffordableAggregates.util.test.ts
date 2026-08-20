import { describe, expect, it } from 'vite-plus/test';

import type { TableColumnGroupingCapability } from '../Table.types';

import { resolveAffordableAggregates } from './resolveAffordableAggregates.util';

/** A dimension the catalogue offers both count flavours on. */
const textCapability: TableColumnGroupingCapability = {
  aggregates: ['count', 'countDistinct', 'max', 'min'],
  canGroup: true,
  column: 'order_status',
  periods: [],
  role: 'dimension',
  typeName: 'text',
};

/** A measure the catalogue offers no distinct count on. */
const numericCapability: TableColumnGroupingCapability = {
  aggregates: ['avg', 'count', 'sum'],
  canGroup: false,
  column: 'total_amount',
  periods: [],
  refusal: 'too-many-distinct',
  role: 'fact',
  typeName: 'numeric',
};

describe('resolveAffordableAggregates', () => {
  it('passes the offerable set through while the budget is unspent', () => {
    expect(
      resolveAffordableAggregates({
        applied: [{ columnKey: 'total_amount', fn: 'sum' }],
        capability: textCapability,
        columnKey: 'order_status',
        isGroupKey: false,
      }),
    ).toStrictEqual({
      affordable: ['count', 'countDistinct', 'min', 'max'],
      withheld: [],
    });
  });

  it('withholds a second countDistinct from another column', () => {
    expect(
      resolveAffordableAggregates({
        applied: [{ columnKey: 'shipped_city', fn: 'countDistinct' }],
        capability: textCapability,
        columnKey: 'order_status',
        isGroupKey: false,
      }),
    ).toStrictEqual({
      affordable: ['count', 'min', 'max'],
      withheld: ['countDistinct'],
    });
  });

  it('keeps offering it on the column that carries it', () => {
    // The whole reason the count excludes this column: the header menu's item
    // for an applied function is the only affordance that removes it, so a rule
    // withholding it everywhere strands the user with a measure they cannot
    // clear from the menu it was applied from (#842).
    expect(
      resolveAffordableAggregates({
        applied: [{ columnKey: 'order_status', fn: 'countDistinct' }],
        capability: textCapability,
        columnKey: 'order_status',
        isGroupKey: false,
      }),
    ).toStrictEqual({
      affordable: ['count', 'countDistinct', 'min', 'max'],
      withheld: [],
    });
  });

  it('offers it again everywhere once it is cleared', () => {
    // Clearing the aggregate is the only thing that changes between this and
    // the withholding case, so the restoration cannot be anything else.
    expect(
      resolveAffordableAggregates({
        applied: [{ columnKey: 'shipped_city', fn: 'count' }],
        capability: textCapability,
        columnKey: 'order_status',
        isGroupKey: false,
      }).affordable,
    ).toStrictEqual(['count', 'countDistinct', 'min', 'max']);
  });

  it('withholds nothing from a column the catalogue never offered it on', () => {
    // `withheld` says what this rule took away, not what is missing: a column
    // with no distinct count to offer has nothing to explain, so the picker
    // stays silent rather than blaming a rail that never bit.
    expect(
      resolveAffordableAggregates({
        applied: [{ columnKey: 'shipped_city', fn: 'countDistinct' }],
        capability: numericCapability,
        columnKey: 'total_amount',
        isGroupKey: false,
      }),
    ).toStrictEqual({ affordable: ['count', 'sum', 'avg'], withheld: [] });
  });

  it('leaves the per-column predicate to answer first', () => {
    // An active group key offers nothing whatever the budget says (ADR-080),
    // and the composition must not resurrect a function that predicate dropped.
    expect(
      resolveAffordableAggregates({
        applied: [],
        capability: textCapability,
        columnKey: 'order_status',
        isGroupKey: true,
      }),
    ).toStrictEqual({ affordable: [], withheld: [] });
  });

  it('counts every other column, not only the last one', () => {
    // A rule reading one entry would pass the case above and let a second
    // distinct count through the moment a third aggregate was staged after it.
    expect(
      resolveAffordableAggregates({
        applied: [
          { columnKey: 'shipped_city', fn: 'countDistinct' },
          { columnKey: 'total_amount', fn: 'sum' },
          { columnKey: 'total_amount', fn: 'avg' },
        ],
        capability: textCapability,
        columnKey: 'order_status',
        isGroupKey: false,
      }).withheld,
    ).toStrictEqual(['countDistinct']);
  });
});
