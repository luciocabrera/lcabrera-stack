import { describe, expect, it } from 'vite-plus/test';

import type {
  TableColumnAggregate,
  TableGroupRowSummary,
} from '#ui/components/Table/Table.types';

import { resolveShareDenominators } from './resolveShareDenominators.util';

const REVENUE_SUM: TableColumnAggregate = { columnKey: 'revenue', fn: 'sum' };

type LeafArgs = {
  readonly label?: string;
  readonly value: number | string;
};

const leaf = ({ label = 'a', value }: LeafArgs): TableGroupRowSummary => ({
  aggregates: [{ columnKey: 'revenue', fn: 'sum', value }],
  count: 1,
  isSubtotal: false,
  path: [{ columnKey: 'status', label, value: label }],
});

const grandTotal = (value: number | string): TableGroupRowSummary => ({
  aggregates: [{ columnKey: 'revenue', fn: 'sum', value }],
  count: 3,
  isSubtotal: true,
  path: [],
});

describe('resolveShareDenominators', () => {
  it('measures nothing when no measure asked for a share', () => {
    expect(
      resolveShareDenominators({
        shares: [],
        summaries: [leaf({ value: 10 })],
      }).size,
    ).toBe(0);
  });

  it('prefers the grand-total row, which the server computed', () => {
    // The leaves here do not add up to the grand total, so this fails if the
    // fallback is taken when a grand total is present.
    expect(
      resolveShareDenominators({
        shares: [REVENUE_SUM],
        summaries: [
          leaf({ label: 'a', value: 10 }),
          leaf({ label: 'b', value: 10 }),
          grandTotal(999),
        ],
      }).get('revenue:sum'),
    ).toBe(999);
  });

  it('sums the leaves when there is no grand-total row', () => {
    expect(
      resolveShareDenominators({
        shares: [REVENUE_SUM],
        summaries: [
          leaf({ label: 'a', value: 10 }),
          leaf({ label: 'b', value: 30 }),
        ],
      }).get('revenue:sum'),
    ).toBe(40);
  });

  it('never counts a subtotal into the summed fallback', () => {
    // A rollup interleaves subtotals with the leaves they total, so counting
    // them would multiply the denominator by the depth of the tree.
    const subtotal: TableGroupRowSummary = {
      aggregates: [{ columnKey: 'revenue', fn: 'sum', value: 40 }],
      count: 2,
      isSubtotal: true,
      path: [{ columnKey: 'status', label: 'a', value: 'a' }],
    };

    expect(
      resolveShareDenominators({
        shares: [REVENUE_SUM],
        summaries: [
          leaf({ label: 'a', value: 10 }),
          leaf({ label: 'b', value: 30 }),
          subtotal,
        ],
      }).get('revenue:sum'),
    ).toBe(40);
  });

  it('reads the string a numeric aggregate arrives as', () => {
    // `pg` sends `numeric` and `bigint` as strings, and they are carried as
    // strings so the displayed value stays lossless.
    expect(
      resolveShareDenominators({
        shares: [REVENUE_SUM],
        summaries: [grandTotal('21302893287.00')],
      }).get('revenue:sum'),
    ).toBe(21_302_893_287);
  });

  it('omits a measure whose denominator is zero', () => {
    // Present-as-zero would divide to Infinity and render as a number nobody
    // computed; absent is what the cell turns into an explicit absence.
    expect(
      resolveShareDenominators({
        shares: [REVENUE_SUM],
        summaries: [grandTotal(0)],
      }).has('revenue:sum'),
    ).toBe(false);
  });

  it('omits a measure whose total cannot be read', () => {
    expect(
      resolveShareDenominators({
        shares: [REVENUE_SUM],
        summaries: [grandTotal('not a number')],
      }).has('revenue:sum'),
    ).toBe(false);
  });

  it('refuses the whole sum when any leaf is unreadable', () => {
    // A total over only the readable rows is a denominator that silently
    // omitted rows — the failure this util exists to avoid.
    expect(
      resolveShareDenominators({
        shares: [REVENUE_SUM],
        summaries: [
          leaf({ label: 'a', value: 10 }),
          leaf({ label: 'b', value: 'nonsense' }),
        ],
      }).has('revenue:sum'),
    ).toBe(false);
  });

  it('omits a measure no row carries an aggregate for', () => {
    expect(
      resolveShareDenominators({
        shares: [{ columnKey: 'missing', fn: 'sum' }],
        summaries: [leaf({ value: 10 })],
      }).has('missing:sum'),
    ).toBe(false);
  });

  it('divides each of two measures on one column by its own total', () => {
    // The failure a column-keyed denominator could not avoid: `count` and `sum`
    // are both shareable, and taking whichever entry came first would divide one
    // measure by the other's total (#831).
    const both: TableGroupRowSummary = {
      aggregates: [
        { columnKey: 'revenue', fn: 'sum', value: 300 },
        { columnKey: 'revenue', fn: 'count', value: 12 },
      ],
      count: 12,
      isSubtotal: true,
      path: [],
    };

    const denominators = resolveShareDenominators({
      shares: [REVENUE_SUM, { columnKey: 'revenue', fn: 'count' }],
      summaries: [both],
    });

    expect(denominators.get('revenue:sum')).toBe(300);
    expect(denominators.get('revenue:count')).toBe(12);
  });

  it('omits a measure whose function no row carries, while its sibling stands', () => {
    const onlySum: TableGroupRowSummary = {
      aggregates: [{ columnKey: 'revenue', fn: 'sum', value: 300 }],
      count: 3,
      isSubtotal: true,
      path: [],
    };

    const denominators = resolveShareDenominators({
      shares: [REVENUE_SUM, { columnKey: 'revenue', fn: 'count' }],
      summaries: [onlySum],
    });

    expect(denominators.get('revenue:sum')).toBe(300);
    expect(denominators.has('revenue:count')).toBe(false);
  });

  it('refuses the sum when only some leaves carry the aggregate', () => {
    // The contract is an exact denominator or an explicit absence. Skipping a
    // leaf that has no entry would total the rows that happened to have one and
    // render a plausible percentage from a partial sum (#648).
    const bare: TableGroupRowSummary = {
      aggregates: [],
      count: 1,
      isSubtotal: false,
      path: [{ columnKey: 'status', label: 'b', value: 'b' }],
    };

    expect(
      resolveShareDenominators({
        shares: [REVENUE_SUM],
        summaries: [leaf({ label: 'a', value: 10 }), bare],
      }).has('revenue:sum'),
    ).toBe(false);
  });
});
