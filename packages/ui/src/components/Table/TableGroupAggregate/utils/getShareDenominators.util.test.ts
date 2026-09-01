import { OLAP_GROUP_ROW_FIELD } from '@lcabrera/api/olap/olap.constants';
import { describe, expect, it } from 'vite-plus/test';

import type { TableColumnAggregate } from '#ui/components/Table/Table.types';

import { getShareDenominators } from './getShareDenominators.util';

type AggregateValue = {
  readonly columnKey: string;
  readonly fn: TableColumnAggregate['fn'];
  readonly value: number;
};

const grandTotal = (aggregates: readonly AggregateValue[]) => ({
  [OLAP_GROUP_ROW_FIELD]: {
    aggregates,
    count: 3,
    isSubtotal: true,
    path: [],
  },
});

describe('getShareDenominators', () => {
  it('measures each shared aggregate against its own total', () => {
    const rows = [
      grandTotal([
        { columnKey: 'revenue', fn: 'sum', value: 300 },
        { columnKey: 'revenue', fn: 'count', value: 12 },
      ]),
    ];

    const denominators = getShareDenominators({
      rows,
      shares: [
        { columnKey: 'revenue', fn: 'sum' },
        { columnKey: 'revenue', fn: 'count' },
      ],
    });

    expect(denominators.get('revenue:sum')).toBe(300);
    expect(denominators.get('revenue:count')).toBe(12);
  });

  it('reuses the derivation while the rows and the selection both hold', () => {
    const rows = [
      grandTotal([{ columnKey: 'revenue', fn: 'sum', value: 300 }]),
    ];
    const shares = [{ columnKey: 'revenue', fn: 'sum' }] as const;

    expect(getShareDenominators({ rows, shares })).toBe(
      getShareDenominators({ rows, shares }),
    );
  });

  it('re-derives when the selection changes against the same rows', () => {
    const rows = [
      grandTotal([{ columnKey: 'revenue', fn: 'sum', value: 300 }]),
    ];

    expect(getShareDenominators({ rows, shares: [] }).has('revenue:sum')).toBe(
      false,
    );
    expect(
      getShareDenominators({
        rows,
        shares: [{ columnKey: 'revenue', fn: 'sum' }],
      }).get('revenue:sum'),
    ).toBe(300);
  });

  it('does not confuse two selections whose joined tokens read alike', () => {
    const rows = [
      grandTotal([
        { columnKey: 'x', fn: 'sum', value: 10 },
        { columnKey: 'y', fn: 'avg', value: 20 },
        { columnKey: 'x:sum y', fn: 'avg', value: 30 },
      ]),
    ];

    const first = getShareDenominators({
      rows,
      shares: [
        { columnKey: 'x', fn: 'sum' },
        { columnKey: 'y', fn: 'avg' },
      ],
    });

    expect(first.get('x:sum')).toBe(10);
    expect(first.get('y:avg')).toBe(20);

    const second = getShareDenominators({
      rows,
      shares: [{ columnKey: 'x:sum y', fn: 'avg' }],
    });

    expect(second.get('x:sum y:avg')).toBe(30);
    expect(second.has('x:sum')).toBe(false);
  });

  it('ignores a row that is not a group row', () => {
    const denominators = getShareDenominators({
      rows: [
        'not an object',
        { some: 'row' },
        grandTotal([{ columnKey: 'revenue', fn: 'sum', value: 300 }]),
      ],
      shares: [{ columnKey: 'revenue', fn: 'sum' }],
    });

    expect(denominators.get('revenue:sum')).toBe(300);
  });
});
