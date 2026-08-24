import { describe, expect, it } from 'vite-plus/test';

import { toGroupHeading } from './to-group-heading.util.ts';

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

const headingFor = (period: 'day' | 'quarter' | 'year') =>
  toGroupHeading({
    columns: COLUMNS,
    params: paramsFor([
      { columnKey: 'order_date', value: '2021-06-14T00:00:00.000Z' },
    ]),
    truncations: { order_date: { isZoned: true, period } },
  });

describe('toGroupHeading', () => {
  it('names each key by its declared column label', () => {
    const heading = toGroupHeading({
      columns: COLUMNS,
      params: paramsFor([{ columnKey: 'shipping_country', value: 'France' }]),
    });

    expect(heading).toBe('Country: France');
  });

  it('falls back to the column key when the route declares no label', () => {
    const heading = toGroupHeading({
      columns: [],
      params: paramsFor([{ columnKey: 'shipping_country', value: 'France' }]),
    });

    expect(heading).toBe('shipping_country: France');
  });

  it('joins a multi-key path outermost first', () => {
    const heading = toGroupHeading({
      columns: COLUMNS,
      params: paramsFor([
        { columnKey: 'shipping_country', value: 'France' },
        { columnKey: 'order_date', value: 'raw' },
      ]),
    });

    expect(heading).toBe('Country: France · Order date: raw');
  });

  it('reads a truncated key as its period, not as its instant', () => {
    // The group row reads `2021-06`. Formatted as a value it would read
    // `2021-06-01T00:00:00.000Z` — a day and an instant the group is not about,
    // disagreeing with the row the reader clicked to get here.
    const heading = toGroupHeading({
      columns: COLUMNS,
      params: paramsFor([
        { columnKey: 'order_date', value: '2021-06-01T00:00:00.000Z' },
      ]),
      truncations: { order_date: { isZoned: true, period: 'month' } },
    });

    expect(heading).toBe('Order date: 2021-06');
  });

  it('reads a zone-free key in the frame it was truncated in', () => {
    // A `date`/`timestamp` key is truncated zone-free, so the instant on the
    // wire is that wall clock rendered from the local zone. Reading it back as
    // UTC would name the previous month under any positive offset.
    const local = new Date(2021, 5, 1);
    const heading = toGroupHeading({
      columns: COLUMNS,
      params: paramsFor([
        { columnKey: 'order_date', value: local.toISOString() },
      ]),
      truncations: { order_date: { isZoned: false, period: 'month' } },
    });

    expect(heading).toBe('Order date: 2021-06');
  });

  it('formats each granularity the way the group row does', () => {
    expect(headingFor('year')).toBe('Order date: 2021');
    expect(headingFor('quarter')).toBe('Order date: 2021-Q2');
    expect(headingFor('day')).toBe('Order date: 2021-06-14');
  });

  it('falls back to the raw label when a truncated value is unreadable', () => {
    const heading = toGroupHeading({
      columns: COLUMNS,
      params: paramsFor([{ columnKey: 'order_date', value: 'not a date' }]),
      truncations: { order_date: { isZoned: true, period: 'month' } },
    });

    expect(heading).toBe('Order date: not a date');
  });

  it('answers undefined for a request naming no readable group', () => {
    expect(
      toGroupHeading({
        columns: COLUMNS,
        params: new URLSearchParams({ group: 'not json' }),
      }),
    ).toBeUndefined();

    expect(
      toGroupHeading({ columns: COLUMNS, params: new URLSearchParams() }),
    ).toBeUndefined();
  });
});
