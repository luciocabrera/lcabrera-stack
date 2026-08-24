import { describe, expect, it, vi } from 'vite-plus/test';

import { resolveGroupRead } from './resolve-group-read.util.ts';

const MAX_LIMIT = 100;
const PRIMARY_KEY = 'order_id';

const groupToken = (group: Record<string, unknown> = {}) =>
  JSON.stringify({
    isSubtotal: false,
    keys: ['shipping_country'],
    path: [{ columnKey: 'shipping_country', value: 'France' }],
    ...group,
  });

/**
 * Written as wire text rather than built from an object: a JSON `null` is the
 * NULL key, and `parseDrillGroup` separates it from a malformed entry by
 * whether `value` is present at all.
 */
const NULL_KEY_TOKEN =
  '{"isSubtotal":false,"keys":["shipping_country"],"path":[{"columnKey":"shipping_country","value":null}]}';

type ResolveGroupReadArgs = Parameters<typeof resolveGroupRead>[0];

const resolve = ({
  entries = {},
  ...overrides
}: Partial<Omit<ResolveGroupReadArgs, 'params'>> & {
  readonly entries?: Record<string, string>;
} = {}) =>
  resolveGroupRead({
    filters: [],
    limit: 25,
    maxLimit: MAX_LIMIT,
    params: new URLSearchParams(entries),
    primaryKey: PRIMARY_KEY,
    skip: 0,
    sort: [],
    ...overrides,
  });

describe('resolveGroupRead', () => {
  it('reads the whole set when no group is named', async () => {
    const resolved = await resolve({ skip: 50 });

    expect(resolved.kind).toBe('read');
    expect(resolved.kind === 'read' && resolved.read).toMatchObject({
      includeTotal: false,
      limit: 25,
      offset: 50,
    });
  });

  it('refuses an absent token on a route that serves only one group', async () => {
    // The other half of the same door. `/paginated` answers both the list and
    // one group, so no token means "the whole set" there. A route whose every
    // response is titled as a group has no such reading — falling through would
    // serve the entire table under a group heading, reached by nothing more
    // exotic than a link that lost its query string.
    const resolved = await resolve({ isGroupRequired: true });

    expect(resolved.kind).toBe('refused');
    expect(resolved.kind === 'refused' && resolved.reason).toBe('absent');
  });

  it('still reads the whole set for an absent token when a group is optional', async () => {
    const resolved = await resolve();

    expect(resolved.kind).toBe('read');
  });

  it('scopes the read to a named group', async () => {
    const resolved = await resolve({ entries: { group: groupToken() } });

    expect(resolved.kind === 'read' && resolved.read.filters).toStrictEqual([
      { column: 'shipping_country', operator: 'eq', value: 'France' },
    ]);
  });

  it('opens a NULL-keyed group with IS NULL rather than an equality', async () => {
    // SQL equality against NULL is never true, so the wrong spelling here shows
    // an empty page for the group a reader is most likely to click into.
    const resolved = await resolve({ entries: { group: NULL_KEY_TOKEN } });

    expect(resolved.kind === 'read' && resolved.read.filters).toStrictEqual([
      { column: 'shipping_country', operator: 'isNull' },
    ]);
  });

  it('refuses an unreadable token instead of reading the whole set', async () => {
    // Falling through on an unreadable token would serve every row in the table
    // under one group's heading — all true, none of them the set asked for.
    for (const group of ['not json', '{}', '{"keys":["a"]}', 'null']) {
      const resolved = await resolve({ entries: { group } });

      expect(resolved.kind).toBe('refused');
      expect(resolved.kind === 'refused' && resolved.reason).toBe('malformed');
    }
  });

  it('refuses a subtotal row, naming what it summarises', async () => {
    const resolved = await resolve({
      entries: { group: groupToken({ isSubtotal: true }) },
    });

    expect(resolved.kind === 'refused' && resolved.reason).toBe('subtotal');
    expect(resolved.kind === 'refused' && resolved.message).toContain(
      'subtotal',
    );
  });

  it('refuses a path naming fewer keys than the view was grouped by', async () => {
    const resolved = await resolve({
      entries: { group: groupToken({ keys: ['shipping_country', 'status'] }) },
    });

    expect(resolved.kind === 'refused' && resolved.reason).toBe(
      'incomplete-path',
    );
  });

  it('keeps the view filters under the group keys', async () => {
    // A group row is computed under the view's filters, so a read that dropped
    // them would open on a larger set than the count it was offered beside.
    const resolved = await resolve({
      entries: { group: groupToken() },
      filters: [{ column: 'status', operator: 'eq', value: 'shipped' }],
    });

    expect(resolved.kind === 'read' && resolved.read.filters).toStrictEqual([
      { column: 'status', operator: 'eq', value: 'shipped' },
      { column: 'shipping_country', operator: 'eq', value: 'France' },
    ]);
  });

  it('counts a group read on its first page only', async () => {
    // The translation sets `includeTotal: false` because it served one page
    // beside a group row that already stated the count. This read pages, so it
    // has to say how far it goes — and only the first page pays for it.
    const first = await resolve({ entries: { group: groupToken() } });
    const second = await resolve({
      entries: { group: groupToken() },
      skip: 25,
    });

    expect(first.kind === 'read' && first.read.includeTotal).toBe(true);
    expect(second.kind === 'read' && second.read.includeTotal).toBe(false);
    expect(second.kind === 'read' && second.read.offset).toBe(25);
  });

  it('bounds the page to the route’s ceiling and breaks ties on its key', async () => {
    const resolved = await resolve({
      entries: { group: groupToken() },
      limit: MAX_LIMIT + 1,
    });

    expect(resolved.kind === 'read' && resolved.read.limit).toBe(MAX_LIMIT);
    expect(resolved.kind === 'read' && resolved.read.sort).toStrictEqual([
      { column: PRIMARY_KEY, direction: 'asc' },
    ]);
  });

  it('looks truncations up only for a token that carries periods', async () => {
    const selectTruncations = vi.fn(async () => ({}));

    await resolve({ entries: { group: groupToken() }, selectTruncations });

    expect(selectTruncations).not.toHaveBeenCalled();

    await resolve({
      entries: {
        group: groupToken({ periods: { shipping_country: 'month' } }),
      },
      selectTruncations,
    });

    expect(selectTruncations).toHaveBeenCalledWith({
      shipping_country: 'month',
    });
  });

  it('carries the cursor through to the scoped read', async () => {
    const resolved = await resolve({
      cursor: [42],
      entries: { group: groupToken() },
    });

    expect(resolved.kind === 'read' && resolved.read.cursor).toStrictEqual([
      42,
    ]);
  });
});
