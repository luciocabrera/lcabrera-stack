import type { TableGroupRowSummary } from '@lcabrera/ui/components/Table/Table.types';

import { describe, expect, it } from 'vite-plus/test';

import { toOrderDrillRead } from './toOrderDrillRead.util';

const VIEW_FILTERS = [
  { column: 'order_date', operator: 'gte', value: '2026-01-01' },
  { column: 'priority', operator: 'eq', value: 'High' },
] as const;

const summary = (
  overrides: Partial<TableGroupRowSummary> = {},
): TableGroupRowSummary => ({
  aggregates: [],
  count: 12,
  isSubtotal: false,
  path: [{ columnKey: 'shipping_country', label: 'Spain', value: 'Spain' }],
  ...overrides,
});

const drill = (
  overrides: Partial<Parameters<typeof toOrderDrillRead>[0]> = {},
) =>
  toOrderDrillRead({
    filters: [...VIEW_FILTERS],
    groupKeys: ['shipping_country'],
    limit: 50,
    sort: [{ column: 'shipping_country', direction: 'asc' }],
    summary: summary(),
    ...overrides,
  });

describe('toOrderDrillRead', () => {
  it('carries every filter the grouped view was read under, unchanged and first', () => {
    // The criterion the whole feature rests on. A drill that drops these
    // returns rows that are individually correct and wrong under the heading
    // they appear beneath.
    const result = drill();

    expect(result.kind).toBe('drillable');
    expect(
      result.kind === 'drillable' ? result.read.filters.slice(0, 2) : undefined,
    ).toEqual([...VIEW_FILTERS]);
  });

  it('appends one equality per path entry, after the view filters', () => {
    const result = drill({
      groupKeys: ['shipping_country', 'order_status'],
      summary: summary({
        path: [
          { columnKey: 'shipping_country', label: 'Spain', value: 'Spain' },
          { columnKey: 'order_status', label: 'Shipped', value: 'Shipped' },
        ],
      }),
    });

    expect(result.kind === 'drillable' ? result.read.filters : []).toEqual([
      ...VIEW_FILTERS,
      { column: 'shipping_country', operator: 'eq', value: 'Spain' },
      { column: 'order_status', operator: 'eq', value: 'Shipped' },
    ]);
  });

  it('uses IS NULL for a null key, never an equality', () => {
    // `shipping_country = NULL` is never true, so an equality here returns an
    // empty page for a group the row says holds 12 orders — silently, on the
    // group a user is most likely to click.
    const nullKey = JSON.parse(
      '{"columnKey":"shipping_country","label":"(empty)","value":null}',
    ) as TableGroupRowSummary['path'][number];
    const result = drill({ summary: summary({ path: [nullKey] }) });
    const keyFilter =
      result.kind === 'drillable' ? result.read.filters.at(-1) : undefined;

    expect(keyFilter).toEqual({
      column: 'shipping_country',
      operator: 'isNull',
    });
    expect(keyFilter).not.toHaveProperty('value');
  });

  it('treats an absent key value as IS NULL too', () => {
    // `undefined` can only mean the key never arrived; an equality against it
    // is the same dead comparison as one against null.
    const result = drill({
      summary: summary({
        path: [
          { columnKey: 'shipping_country', label: '(empty)', value: undefined },
        ],
      }),
    });

    expect(
      result.kind === 'drillable' ? result.read.filters.at(-1) : undefined,
    ).toEqual({ column: 'shipping_country', operator: 'isNull' });
  });

  it('drops the group-key terms from the sort and appends the tiebreaker', () => {
    const result = drill({
      sort: [
        { column: 'shipping_country', direction: 'asc' },
        { column: 'total_amount', direction: 'desc' },
      ],
    });

    expect(result.kind === 'drillable' ? result.read.sort : []).toEqual([
      { column: 'total_amount', direction: 'desc' },
      { column: 'order_id', direction: 'asc' },
    ]);
  });

  it('does not append a second tiebreaker when the view already sorts by it', () => {
    const result = drill({
      sort: [
        { column: 'shipping_country', direction: 'asc' },
        { column: 'order_id', direction: 'desc' },
      ],
    });

    expect(result.kind === 'drillable' ? result.read.sort : []).toEqual([
      { column: 'order_id', direction: 'desc' },
    ]);
  });

  it('never carries a grouping, so the read cannot return group rows again', () => {
    // Forwarding the view's grouping would send this straight back into the
    // grouped branch of `selectOrdersPage` — the mistake that looks like it
    // works, because it returns rows.
    const result = drill();

    expect(
      result.kind === 'drillable' ? result.read.grouping : 'not-drillable',
    ).toBeUndefined();
  });

  it('asks for one bounded page and no total', () => {
    const result = drill({ limit: 25 });

    expect(result.kind === 'drillable' ? result.read : undefined).toMatchObject(
      {
        includeTotal: false,
        limit: 25,
        offset: 0,
      },
    );
  });

  it('clamps the limit to the route ceiling', () => {
    const result = drill({ limit: 10_000 });

    expect(result.kind === 'drillable' ? result.read.limit : undefined).toBe(
      1000,
    );
  });

  it.each([
    {
      expected: 'grand-total',
      name: 'a grand total',
      summary: summary({ isSubtotal: true, path: [] }),
    },
    {
      expected: 'subtotal',
      name: 'a subtotal',
      summary: summary({ isSubtotal: true }),
    },
  ])('refuses $name as `$expected`', ({ expected, summary: refused }) => {
    const result = drill({ summary: refused });

    expect(result).toEqual({ kind: 'refused', reason: expected });
  });

  it('names a grand total before it names a subtotal', () => {
    // A grand total is *also* `isSubtotal`, so a subtotal-first ordering reports
    // the less specific reason for every grand total. Same trap the row-style
    // resolver already pays for.
    expect(drill({ summary: summary({ isSubtotal: true, path: [] }) })).toEqual(
      {
        kind: 'refused',
        reason: 'grand-total',
      },
    );
  });

  it('refuses a path shorter than the applied keys', () => {
    // Only the innermost grouping set has rows directly underneath it, so a
    // partial path would drill into a set the row does not identify.
    expect(drill({ groupKeys: ['shipping_country', 'order_status'] })).toEqual({
      kind: 'refused',
      reason: 'incomplete-path',
    });
  });
});
