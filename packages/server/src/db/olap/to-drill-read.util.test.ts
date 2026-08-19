import type { OlapDrillGroup } from '@lcabrera/api/olap/olap.types';

import { describe, expect, it } from 'vite-plus/test';

import { toDrillRead } from './to-drill-read.util';

const VIEW_FILTERS = [
  { column: 'created_at', operator: 'gte', value: '2026-01-01' },
  { column: 'priority', operator: 'eq', value: 'High' },
] as const;

const MAX_LIMIT = 1000;
const PRIMARY_KEY = 'entity_id';

const groupOf = (overrides: Partial<OlapDrillGroup> = {}): OlapDrillGroup => ({
  isSubtotal: false,
  path: [{ columnKey: 'region', value: 'Iberia' }],
  ...overrides,
});

const drill = (overrides: Partial<Parameters<typeof toDrillRead>[0]> = {}) =>
  toDrillRead({
    filters: [...VIEW_FILTERS],
    group: groupOf(),
    groupKeys: ['region'],
    limit: 50,
    maxLimit: MAX_LIMIT,
    primaryKey: PRIMARY_KEY,
    sort: [{ column: 'region', direction: 'asc' }],
    ...overrides,
  });

describe('toDrillRead', () => {
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
      group: groupOf({
        path: [
          { columnKey: 'region', value: 'Iberia' },
          { columnKey: 'status', value: 'Shipped' },
        ],
      }),
      groupKeys: ['region', 'status'],
    });

    expect(result.kind === 'drillable' ? result.read.filters : []).toEqual([
      ...VIEW_FILTERS,
      { column: 'region', operator: 'eq', value: 'Iberia' },
      { column: 'status', operator: 'eq', value: 'Shipped' },
    ]);
  });

  it('uses IS NULL for a null key, never an equality', () => {
    // `region = NULL` is never true, so an equality here returns an empty page
    // for a group the row says holds rows — silently, on the group a user is
    // most likely to click.
    const nullKey = JSON.parse(
      '{"columnKey":"region","value":null}',
    ) as OlapDrillGroup['path'][number];
    const result = drill({ group: groupOf({ path: [nullKey] }) });
    const keyFilter =
      result.kind === 'drillable' ? result.read.filters.at(-1) : undefined;

    expect(keyFilter).toEqual({ column: 'region', operator: 'isNull' });
    expect(keyFilter).not.toHaveProperty('value');
  });

  it('treats an absent key value as IS NULL too', () => {
    // `undefined` can only mean the key never arrived; an equality against it
    // is the same dead comparison as one against null.
    const result = drill({
      group: groupOf({ path: [{ columnKey: 'region', value: undefined }] }),
    });

    expect(
      result.kind === 'drillable' ? result.read.filters.at(-1) : undefined,
    ).toEqual({ column: 'region', operator: 'isNull' });
  });

  it('drops the group-key terms from the sort and appends the tiebreaker', () => {
    const result = drill({
      sort: [
        { column: 'region', direction: 'asc' },
        { column: 'total_amount', direction: 'desc' },
      ],
    });

    expect(result.kind === 'drillable' ? result.read.sort : []).toEqual([
      { column: 'total_amount', direction: 'desc' },
      { column: PRIMARY_KEY, direction: 'asc' },
    ]);
  });

  it('does not append a second tiebreaker when the view already sorts by it', () => {
    const result = drill({
      sort: [
        { column: 'region', direction: 'asc' },
        { column: PRIMARY_KEY, direction: 'desc' },
      ],
    });

    expect(result.kind === 'drillable' ? result.read.sort : []).toEqual([
      { column: PRIMARY_KEY, direction: 'desc' },
    ]);
  });

  it('never carries a grouping, so the read cannot return group rows again', () => {
    // Forwarding the view's grouping would send the read straight back into the
    // grouped branch — the mistake that looks like it works, because it returns
    // rows.
    const result = drill();

    expect(result.kind === 'drillable' ? result.read : {}).not.toHaveProperty(
      'grouping',
    );
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

  it('clamps the limit to the ceiling the caller passed', () => {
    const result = drill({ limit: 10_000 });

    expect(result.kind === 'drillable' ? result.read.limit : undefined).toBe(
      MAX_LIMIT,
    );
  });

  it.each([
    {
      expected: 'grand-total',
      group: groupOf({ isSubtotal: true, path: [] }),
      name: 'a grand total',
    },
    {
      expected: 'subtotal',
      group: groupOf({ isSubtotal: true }),
      name: 'a subtotal',
    },
  ])('refuses $name as `$expected`', ({ expected, group }) => {
    expect(drill({ group })).toEqual({ kind: 'refused', reason: expected });
  });

  it('names a grand total before it names a subtotal', () => {
    // A grand total is *also* `isSubtotal`, so a subtotal-first ordering reports
    // the less specific reason for every grand total.
    expect(drill({ group: groupOf({ isSubtotal: true, path: [] }) })).toEqual({
      kind: 'refused',
      reason: 'grand-total',
    });
  });

  it('refuses a path shorter than the applied keys', () => {
    // Only the innermost grouping set has rows directly underneath it, so a
    // partial path would drill into a set the row does not identify.
    expect(drill({ groupKeys: ['region', 'status'] })).toEqual({
      kind: 'refused',
      reason: 'incomplete-path',
    });
  });
});
