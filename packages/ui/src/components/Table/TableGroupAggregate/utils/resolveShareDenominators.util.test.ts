import { describe, expect, it } from 'vite-plus/test';

import type { TableGroupRowSummary } from '#ui/components/Table/Table.types';

import { resolveShareDenominators } from './resolveShareDenominators.util';

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
  it('measures nothing when no column asked for a share', () => {
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
        shares: ['revenue'],
        summaries: [
          leaf({ label: 'a', value: 10 }),
          leaf({ label: 'b', value: 10 }),
          grandTotal(999),
        ],
      }).get('revenue'),
    ).toBe(999);
  });

  it('sums the leaves when there is no grand-total row', () => {
    expect(
      resolveShareDenominators({
        shares: ['revenue'],
        summaries: [
          leaf({ label: 'a', value: 10 }),
          leaf({ label: 'b', value: 30 }),
        ],
      }).get('revenue'),
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
        shares: ['revenue'],
        summaries: [
          leaf({ label: 'a', value: 10 }),
          leaf({ label: 'b', value: 30 }),
          subtotal,
        ],
      }).get('revenue'),
    ).toBe(40);
  });

  it('reads the string a numeric aggregate arrives as', () => {
    // `pg` sends `numeric` and `bigint` as strings, and they are carried as
    // strings so the displayed value stays lossless.
    expect(
      resolveShareDenominators({
        shares: ['revenue'],
        summaries: [grandTotal('21302893287.00')],
      }).get('revenue'),
    ).toBe(21_302_893_287);
  });

  it('omits a column whose denominator is zero', () => {
    // Present-as-zero would divide to Infinity and render as a number nobody
    // computed; absent is what the cell turns into an explicit absence.
    expect(
      resolveShareDenominators({
        shares: ['revenue'],
        summaries: [grandTotal(0)],
      }).has('revenue'),
    ).toBe(false);
  });

  it('omits a column whose total cannot be read', () => {
    expect(
      resolveShareDenominators({
        shares: ['revenue'],
        summaries: [grandTotal('not a number')],
      }).has('revenue'),
    ).toBe(false);
  });

  it('refuses the whole sum when any leaf is unreadable', () => {
    // A total over only the readable rows is a denominator that silently
    // omitted rows — the failure this util exists to avoid.
    expect(
      resolveShareDenominators({
        shares: ['revenue'],
        summaries: [
          leaf({ label: 'a', value: 10 }),
          leaf({ label: 'b', value: 'nonsense' }),
        ],
      }).has('revenue'),
    ).toBe(false);
  });

  it('omits a column no row carries an aggregate for', () => {
    expect(
      resolveShareDenominators({
        shares: ['missing'],
        summaries: [leaf({ value: 10 })],
      }).has('missing'),
    ).toBe(false);
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
        shares: ['revenue'],
        summaries: [leaf({ label: 'a', value: 10 }), bare],
      }).has('revenue'),
    ).toBe(false);
  });
});
