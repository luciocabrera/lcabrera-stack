import { describe, expect, it } from 'vite-plus/test';

import { toGroupRestrictions } from './to-group-restrictions.util.ts';

const COLUMNS = [
  { key: 'order_date', label: 'Order date' },
  { key: 'shipping_country', label: 'Country' },
] as const;

const paramsFor = (path: readonly Record<string, unknown>[]) =>
  new URLSearchParams({
    group: JSON.stringify({
      isSubtotal: false,
      keys: path.map((entry) => entry.columnKey),
      path,
    }),
  });

const valueFor = (period: 'day' | 'quarter' | 'year') =>
  toGroupRestrictions({
    columns: COLUMNS,
    params: paramsFor([
      { columnKey: 'order_date', value: '2021-06-14T00:00:00.000Z' },
    ]),
    truncations: { order_date: { isZoned: true, period } },
  })?.[0]?.value;

describe('toGroupRestrictions', () => {
  it('names each key by its declared column label', () => {
    expect(
      toGroupRestrictions({
        columns: COLUMNS,
        params: paramsFor([{ columnKey: 'shipping_country', value: 'France' }]),
      }),
    ).toEqual([
      { columnKey: 'shipping_country', label: 'Country', value: 'France' },
    ]);
  });

  it('falls back to the column key when the route declares no label', () => {
    expect(
      toGroupRestrictions({
        columns: [],
        params: paramsFor([{ columnKey: 'shipping_country', value: 'France' }]),
      }),
    ).toEqual([
      {
        columnKey: 'shipping_country',
        label: 'shipping_country',
        value: 'France',
      },
    ]);
  });

  it('lists a multi-key path outermost first', () => {
    const restrictions = toGroupRestrictions({
      columns: COLUMNS,
      params: paramsFor([
        { columnKey: 'shipping_country', value: 'France' },
        { columnKey: 'order_date', value: 'raw' },
      ]),
    });

    expect(restrictions).toEqual([
      { columnKey: 'shipping_country', label: 'Country', value: 'France' },
      { columnKey: 'order_date', label: 'Order date', value: 'raw' },
    ]);
  });

  it('reads a truncated key as its period, not as its instant', () => {
    // The group row reads `2021-06`. Formatted as a value it would read
    // `2021-06-01T00:00:00.000Z` — a day and an instant the group is not about,
    // disagreeing with the row the reader clicked to get here.
    const restrictions = toGroupRestrictions({
      columns: COLUMNS,
      params: paramsFor([
        { columnKey: 'order_date', value: '2021-06-01T00:00:00.000Z' },
      ]),
      truncations: { order_date: { isZoned: true, period: 'month' } },
    });

    expect(restrictions?.[0]?.value).toBe('2021-06');
  });

  it('reads a zone-free key in the frame it was truncated in', () => {
    // A `date`/`timestamp` key is truncated zone-free, so the instant on the
    // wire is that wall clock rendered from the local zone. Reading it back as
    // UTC would name the previous month under any positive offset.
    const local = new Date(2021, 5, 1);
    const restrictions = toGroupRestrictions({
      columns: COLUMNS,
      params: paramsFor([
        { columnKey: 'order_date', value: local.toISOString() },
      ]),
      truncations: { order_date: { isZoned: false, period: 'month' } },
    });

    expect(restrictions?.[0]?.value).toBe('2021-06');
  });

  it('formats each granularity the way the group row does', () => {
    expect(valueFor('year')).toBe('2021');
    expect(valueFor('quarter')).toBe('2021-Q2');
    expect(valueFor('day')).toBe('2021-06-14');
  });

  it('falls back to the raw label when a truncated value is unreadable', () => {
    const restrictions = toGroupRestrictions({
      columns: COLUMNS,
      params: paramsFor([{ columnKey: 'order_date', value: 'not a date' }]),
      truncations: { order_date: { isZoned: true, period: 'month' } },
    });

    expect(restrictions?.[0]?.value).toBe('not a date');
  });

  it('answers undefined for a request naming no readable group', () => {
    // Not an empty list: a caller drawing `[]` says nothing restricts these
    // rows, and a refused token means the opposite.
    expect(
      toGroupRestrictions({
        columns: COLUMNS,
        params: new URLSearchParams({ group: 'not json' }),
      }),
    ).toBeUndefined();

    expect(
      toGroupRestrictions({ columns: COLUMNS, params: new URLSearchParams() }),
    ).toBeUndefined();
  });
});
