import { describe, expect, it, vi } from 'vite-plus/test';

import { GROUP_READ_REFUSAL_MESSAGE } from './olap.constants.ts';
import { resolveGroupRead } from './resolve-group-read.util.ts';
import { resolveGroupRestriction } from './resolve-group-restriction.util.ts';

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

const truncatedParams = (value: string) =>
  new URLSearchParams({
    group: JSON.stringify({
      isSubtotal: false,
      keys: ['order_date'],
      path: [{ columnKey: 'order_date', value }],
      periods: { order_date: 'month' },
    }),
  });

const valueFor = async (period: 'day' | 'month' | 'quarter' | 'year') => {
  const restriction = await resolveGroupRestriction({
    columns: COLUMNS,
    params: truncatedParams('2021-06-14T00:00:00.000Z'),
    selectTruncations: async () => ({
      order_date: { isZoned: true, period },
    }),
  });

  return restriction?.entries[0]?.value;
};

const tokenFor = (raw: Record<string, unknown>) =>
  new URLSearchParams({ group: JSON.stringify(raw) });

const COMPLETE_PATH = [{ columnKey: 'shipping_country', value: 'France' }];

const REFUSAL_REQUESTS = [
  { name: 'no token', params: new URLSearchParams() },
  {
    name: 'an unparseable token',
    params: new URLSearchParams({ group: 'not json' }),
  },
  {
    name: 'a grand total',
    params: tokenFor({
      isSubtotal: false,
      keys: ['shipping_country'],
      path: [],
    }),
  },
  {
    name: 'a subtotal',
    params: tokenFor({
      isSubtotal: true,
      keys: ['shipping_country'],
      path: COMPLETE_PATH,
    }),
  },
  {
    name: 'a path shorter than the applied keys',
    params: tokenFor({
      isSubtotal: false,
      keys: ['shipping_country', 'order_date'],
      path: COMPLETE_PATH,
    }),
  },
  {
    name: 'a readable group',
    params: tokenFor({
      isSubtotal: false,
      keys: ['shipping_country'],
      path: COMPLETE_PATH,
    }),
  },
];

const readFor = async (params: URLSearchParams) =>
  resolveGroupRead({
    filters: [],
    isGroupRequired: true,
    limit: 50,
    maxLimit: 500,
    params,
    primaryKey: 'id',
    skip: 0,
    sort: [],
  });

const restrictionFor = async (params: URLSearchParams) =>
  resolveGroupRestriction({
    columns: COLUMNS,
    isGroupRequired: true,
    params,
  });

describe('resolveGroupRestriction', () => {
  it('names each key by its declared column label', async () => {
    expect(
      await resolveGroupRestriction({
        columns: COLUMNS,
        params: paramsFor([{ columnKey: 'shipping_country', value: 'France' }]),
      }),
    ).toEqual({
      entries: [
        { columnKey: 'shipping_country', label: 'Country', value: 'France' },
      ],
    });
  });

  it('falls back to the column key when the caller declares no label', async () => {
    expect(
      await resolveGroupRestriction({
        columns: [],
        params: paramsFor([{ columnKey: 'shipping_country', value: 'France' }]),
      }),
    ).toEqual({
      entries: [
        {
          columnKey: 'shipping_country',
          label: 'shipping_country',
          value: 'France',
        },
      ],
    });
  });

  it('lists a multi-key path outermost first', async () => {
    const restriction = await resolveGroupRestriction({
      columns: COLUMNS,
      params: paramsFor([
        { columnKey: 'shipping_country', value: 'France' },
        { columnKey: 'order_date', value: 'raw' },
      ]),
    });

    expect(restriction?.entries).toEqual([
      { columnKey: 'shipping_country', label: 'Country', value: 'France' },
      { columnKey: 'order_date', label: 'Order date', value: 'raw' },
    ]);
  });

  it('looks the granularity up only when the token carries one', async () => {
    const selectTruncations = vi.fn(async () => ({
      order_date: { isZoned: true, period: 'month' as const },
    }));

    await resolveGroupRestriction({
      columns: COLUMNS,
      params: paramsFor([{ columnKey: 'shipping_country', value: 'France' }]),
      selectTruncations,
    });

    expect(selectTruncations).not.toHaveBeenCalled();

    await resolveGroupRestriction({
      columns: COLUMNS,
      params: truncatedParams('2021-06-14T00:00:00.000Z'),
      selectTruncations,
    });

    expect(selectTruncations).toHaveBeenCalledWith({ order_date: 'month' });
  });

  it('reads a truncated key as its period, not as its instant', async () => {
    expect(await valueFor('month')).toBe('2021-06');
  });

  it('reads a zone-free key in the frame it was truncated in', async () => {
    const local = new Date(2021, 5, 1);
    const restriction = await resolveGroupRestriction({
      columns: COLUMNS,
      params: truncatedParams(local.toISOString()),
      selectTruncations: async () => ({
        order_date: { isZoned: false, period: 'month' as const },
      }),
    });

    expect(restriction?.entries[0]?.value).toBe('2021-06');
  });

  it('formats each granularity the way the group row does', async () => {
    expect(await valueFor('year')).toBe('2021');
    expect(await valueFor('quarter')).toBe('2021-Q2');
    expect(await valueFor('day')).toBe('2021-06-14');
  });

  it('falls back to the raw label when a truncated value is unreadable', async () => {
    const restriction = await resolveGroupRestriction({
      columns: COLUMNS,
      params: truncatedParams('not a date'),
      selectTruncations: async () => ({
        order_date: { isZoned: true, period: 'month' as const },
      }),
    });

    expect(restriction?.entries[0]?.value).toBe('not a date');
  });

  it('refuses an unreadable token with the sentence the refused read carries', async () => {
    expect(
      await resolveGroupRestriction({
        columns: COLUMNS,
        params: new URLSearchParams({ group: 'not json' }),
      }),
    ).toEqual({
      entries: [],
      refusal: GROUP_READ_REFUSAL_MESSAGE.malformed,
    });
  });

  it('refuses an absent token where the caller requires one', async () => {
    expect(
      await resolveGroupRestriction({
        columns: COLUMNS,
        isGroupRequired: true,
        params: new URLSearchParams(),
      }),
    ).toEqual({
      entries: [],
      refusal: GROUP_READ_REFUSAL_MESSAGE.absent,
    });
  });

  it('answers undefined for an absent token where the caller does not require one', async () => {
    expect(
      await resolveGroupRestriction({
        columns: COLUMNS,
        params: new URLSearchParams(),
      }),
    ).toBeUndefined();
  });
  describe('agrees with resolveGroupRead on every refusal', () => {
    it.each(REFUSAL_REQUESTS)(
      'refuses $name the same way, with the same sentence',
      async ({ params }) => {
        const read = await readFor(params);
        const restriction = await restrictionFor(params);

        expect(restriction?.refusal !== undefined).toBe(
          read.kind === 'refused',
        );
        expect(restriction?.refusal).toBe(
          read.kind === 'refused' ? read.message : undefined,
        );
      },
    );

    it.each(REFUSAL_REQUESTS)(
      'never answers $name with neither entries nor a refusal',
      async ({ params }) => {
        const restriction = await restrictionFor(params);

        expect(
          restriction === undefined ||
            restriction.entries.length > 0 ||
            restriction.refusal !== undefined,
        ).toBe(true);
      },
    );
  });
});
