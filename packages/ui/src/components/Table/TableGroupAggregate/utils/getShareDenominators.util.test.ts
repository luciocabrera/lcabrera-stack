import { OLAP_GROUP_ROW_FIELD } from '@lcabrera/api/olap/olap.constants';
import { describe, expect, it } from 'vite-plus/test';

import type { TableColumnAggregate } from '#ui/components/Table/Table.types';

import { getShareDenominators } from './getShareDenominators.util';

type AggregateValue = {
  readonly columnKey: string;
  readonly fn: TableColumnAggregate['fn'];
  readonly value: number;
};

/** A grand-total row, which is what `resolveShareDenominators` prefers. */
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
    // The rows are untouched by a share toggle, so an entry keyed on the rows
    // alone would answer for the previous selection.
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
    // The discriminating case, and it needs a column key containing a SPACE:
    // under `tokens.join(' ')` these two selections both key as
    // `x:sum y:avg`, so the second read against the same rows array came back
    // with the first one's denominators — a wrong percentage on screen, with
    // nothing thrown. A key without a space passes either way.
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
    // The collision's symptom: the stale entry answering for the new selection.
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
