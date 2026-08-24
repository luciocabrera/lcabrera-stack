import { describe, expect, it } from 'vite-plus/test';

import type {
  TableGroupPeriod,
  TableGroupRowSummary,
} from '#ui/components/Table/Table.types';

import { resolveGroupDetailsHref } from './resolveGroupDetailsHref.util';

const NO_PERIODS: Readonly<Record<string, TableGroupPeriod>> = {};

const summaryOf = (
  overrides: Partial<TableGroupRowSummary> = {},
): TableGroupRowSummary =>
  ({
    count: 12,
    isSubtotal: false,
    path: [{ columnKey: 'shipping_country', label: 'France', value: 'France' }],
    ...overrides,
  }) as TableGroupRowSummary;

const resolve = (
  args: Partial<Parameters<typeof resolveGroupDetailsHref>[0]>,
) =>
  resolveGroupDetailsHref({
    groupDetailsPath: '/enterprise-orders/group',
    groupingKeys: ['shipping_country'],
    periods: NO_PERIODS,
    search: '',
    summary: summaryOf(),
    ...args,
  });

/** A relative href has no origin, so one is supplied purely to parse it. */
const paramsOf = (href: string | undefined) =>
  new URL(href ?? '', 'http://table.test').searchParams;

const groupParamOf = (href: string | undefined) =>
  href === undefined ? undefined : paramsOf(href).get('group');

describe('resolveGroupDetailsHref', () => {
  it('links a complete group to the details route', () => {
    const href = resolve({});

    expect(href?.startsWith('/enterprise-orders/group?')).toBe(true);
    expect(JSON.parse(groupParamOf(href) ?? '{}')).toStrictEqual({
      isSubtotal: false,
      keys: ['shipping_country'],
      path: [{ columnKey: 'shipping_country', value: 'France' }],
    });
  });

  it('drops the display label from the token', () => {
    // A formatted string has no business reaching a query, and a label frozen
    // into a shared link outlives the value it describes.
    expect(groupParamOf(resolve({}))).not.toContain('label');
  });

  it('offers nothing when the route serves no group details', () => {
    // Absent means the affordance is not offered, rather than a link whose
    // every use 404s.
    expect(resolve({ groupDetailsPath: undefined })).toBeUndefined();
  });

  it('offers nothing for a subtotal', () => {
    expect(
      resolve({ summary: summaryOf({ isSubtotal: true }) }),
    ).toBeUndefined();
  });

  it('offers nothing for an incomplete path', () => {
    // An outer level's children are already on screen as further group rows.
    expect(
      resolve({ groupingKeys: ['shipping_country', 'status'] }),
    ).toBeUndefined();
  });

  it('offers nothing for the grand total', () => {
    // Both lengths are zero with no grouping applied, so the length comparison
    // alone would call the grand total complete and link it to every row.
    expect(
      resolve({ groupingKeys: [], summary: summaryOf({ path: [] }) }),
    ).toBeUndefined();
  });

  it('carries every other search param through', () => {
    // The list's filters and sorting are the floor the modal inherits: the
    // group row was computed under them, so a link that dropped them would open
    // on a larger set than the count it sits beside.
    const href = resolve({
      search: '?filters=%7B%22status%22%3A1%7D&sorting=x',
    });
    const params = paramsOf(href);

    expect(params.get('filters')).toBe('{"status":1}');
    expect(params.get('sorting')).toBe('x');
  });

  it('carries the granularity a temporal key was grouped at', () => {
    // A truncated key is filtered as a range rather than an equality, and the
    // server cannot know which range without the period (#786).
    const href = resolve({
      groupingKeys: ['order_date'],
      periods: { order_date: 'month' },
      summary: summaryOf({
        path: [
          { columnKey: 'order_date', label: '2021-03', value: '2021-03-01' },
        ],
      }),
    });

    expect(JSON.parse(groupParamOf(href) ?? '{}')).toMatchObject({
      periods: { order_date: 'month' },
    });
  });
});
