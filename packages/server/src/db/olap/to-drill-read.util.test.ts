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

describe('a truncated group key', () => {
  const march = new Date(2021, 2, 1);

  const drillPeriod = ({
    truncations,
    value = march,
  }: {
    readonly truncations: Record<
      string,
      { isZoned: boolean; period: 'day' | 'month' | 'quarter' | 'year' }
    >;
    readonly value?: unknown;
  }) =>
    toDrillRead({
      filters: [{ column: 'priority', operator: 'eq', value: 'High' }],
      group: {
        isSubtotal: false,
        path: [{ columnKey: 'order_date', value }],
      },
      groupKeys: ['order_date'],
      limit: 50,
      maxLimit: 100,
      primaryKey: 'order_id',
      sort: [],
      truncations,
    });

  it('becomes a half-open range on the raw column, not an equality', () => {
    // The group `2021-03` is `date_trunc('month', …)`, and no row holds that
    // value — every row holds an instant inside the month. Equality returns the
    // first of the month and nothing else.
    const drill = drillPeriod({
      truncations: { order_date: { isZoned: false, period: 'month' } },
    });

    expect(drill.kind).toBe('drillable');
    expect(drill.kind === 'drillable' && drill.read.filters).toStrictEqual([
      { column: 'priority', operator: 'eq', value: 'High' },
      { column: 'order_date', operator: 'gte', value: march },
      { column: 'order_date', operator: 'lt', value: new Date(2021, 3, 1) },
    ]);
  });

  it("keeps the view's own filters ahead of the range", () => {
    // The correctness criterion that fails quietly: a drill drawn without them
    // returns rows that are true facts about the table and wrong under the
    // heading they appear beneath.
    const drill = drillPeriod({
      truncations: { order_date: { isZoned: false, period: 'year' } },
    });

    expect(drill.kind === 'drillable' && drill.read.filters[0]).toStrictEqual({
      column: 'priority',
      operator: 'eq',
      value: 'High',
    });
  });

  it('still says IS NULL for a NULL period group', () => {
    // `date_trunc` of NULL is NULL, so a truncated key has a NULL group exactly
    // as an untruncated one does — and it is still the group a range comparison
    // would silently return nothing for.
    const drill = drillPeriod({
      truncations: { order_date: { isZoned: false, period: 'month' } },
      // A real JSON null without the literal the lint rules forbid — the same
      // trick the untruncated NULL case above uses.
      value: JSON.parse('null') as unknown,
    });

    expect(drill.kind === 'drillable' && drill.read.filters).toStrictEqual([
      { column: 'priority', operator: 'eq', value: 'High' },
      { column: 'order_date', operator: 'isNull' },
    ]);
  });

  it('falls back to equality rather than a range drawn from an unparseable bound', () => {
    // Returning nothing is the honest failure; a range computed from
    // parsed-to-garbage boundaries would return the wrong rows and look right.
    const drill = drillPeriod({
      truncations: { order_date: { isZoned: false, period: 'month' } },
      value: 'not a date',
    });

    expect(drill.kind === 'drillable' && drill.read.filters).toStrictEqual([
      { column: 'priority', operator: 'eq', value: 'High' },
      { column: 'order_date', operator: 'eq', value: 'not a date' },
    ]);
  });

  it('leaves an untruncated key an equality', () => {
    const drill = drillPeriod({ truncations: {} });

    expect(drill.kind === 'drillable' && drill.read.filters).toStrictEqual([
      { column: 'priority', operator: 'eq', value: 'High' },
      { column: 'order_date', operator: 'eq', value: march },
    ]);
  });
});

describe('a sort naming a measure column', () => {
  it('is dropped, because a drill is an ungrouped read', () => {
    // The grid keys a measure column `column:fn` and that key is ordinary sort
    // state, so it travels with the request. A grouped read honours it —
    // `toGroupSort` maps it onto the aggregate's alias — but a drill reads the
    // group's rows with no grouping at all, where no such column exists.
    // `buildOrderByClause` validates every term against `allowedColumns` and
    // refuses the whole query, so leaving it in fails the drill outright
    // rather than ignoring the term.
    const result = drill({
      sort: [
        { column: 'total_amount:avg', direction: 'desc' },
        { column: 'order_date', direction: 'asc' },
      ],
    });

    if (result.kind !== 'drillable') throw new Error('expected a drillable');

    expect(result.read.sort).toStrictEqual([
      { column: 'order_date', direction: 'asc' },
      { column: PRIMARY_KEY, direction: 'asc' },
    ]);
  });

  it('covers every function in the vocabulary, not just the common ones', () => {
    const result = drill({
      sort: [
        { column: 'a:boolAnd', direction: 'asc' },
        { column: 'b:countDistinct', direction: 'asc' },
        { column: 'c:sum', direction: 'asc' },
      ],
    });

    if (result.kind !== 'drillable') throw new Error('expected a drillable');

    expect(result.read.sort).toStrictEqual([
      { column: PRIMARY_KEY, direction: 'asc' },
    ]);
  });

  it('keeps a real column whose name merely contains a colon', () => {
    // The split is on the last colon and the suffix must be a known function,
    // so an ordinary column is never mistaken for a measure.
    const result = drill({
      sort: [{ column: 'odd:column', direction: 'asc' }],
    });

    if (result.kind !== 'drillable') throw new Error('expected a drillable');

    expect(result.read.sort).toStrictEqual([
      { column: 'odd:column', direction: 'asc' },
      { column: PRIMARY_KEY, direction: 'asc' },
    ]);
  });
});
