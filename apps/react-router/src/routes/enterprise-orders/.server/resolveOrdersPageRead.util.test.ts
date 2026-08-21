import { describe, expect, it, vi } from 'vite-plus/test';

import { resolveOrdersPageRead } from './resolveOrdersPageRead.util';

vi.mock('./enterpriseOrders.service', () => ({
  selectOrderGroupKeyTruncations: vi.fn(async () => ({})),
}));

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

const paramsFor = (entries: Record<string, string>) =>
  new URLSearchParams({ limit: '25', skip: '0', ...entries });

describe('resolveOrdersPageRead', () => {
  it('reads the whole table when no group is named', async () => {
    const resolved = await resolveOrdersPageRead(
      paramsFor({ limit: '25', skip: '50' }),
    );

    expect(resolved.kind).toBe('read');
    expect(resolved.kind === 'read' && resolved.read).toMatchObject({
      includeTotal: false,
      limit: 25,
      offset: 50,
    });
  });

  it('scopes the read to a named group', async () => {
    const resolved = await resolveOrdersPageRead(
      paramsFor({ group: groupToken() }),
    );

    expect(resolved.kind).toBe('read');
    expect(resolved.kind === 'read' && resolved.read.filters).toStrictEqual([
      { column: 'shipping_country', operator: 'eq', value: 'France' },
    ]);
  });

  it('opens a NULL-keyed group with IS NULL rather than an equality', async () => {
    // SQL equality against NULL is never true, so the wrong spelling here shows
    // an empty modal for the group a reader is most likely to click into.
    const resolved = await resolveOrdersPageRead(
      paramsFor({ group: NULL_KEY_TOKEN }),
    );

    expect(resolved.kind === 'read' && resolved.read.filters).toStrictEqual([
      { column: 'shipping_country', operator: 'isNull' },
    ]);
  });

  it('refuses an unreadable group token instead of reading the whole table', async () => {
    // The failure this guard exists for. `parseDrillGroup` answers `undefined`
    // both for "no group" and for "a group I cannot read", so falling through
    // on the second would serve every order in the table under one group's
    // heading — rows that are all true and none of them the set asked for.
    for (const group of ['not json', '{}', '{"keys":["a"]}', 'null']) {
      const resolved = await resolveOrdersPageRead(paramsFor({ group }));

      expect(resolved.kind).toBe('refused');
    }
  });

  it('refuses a subtotal row, naming what it summarises', async () => {
    const resolved = await resolveOrdersPageRead(
      paramsFor({ group: groupToken({ isSubtotal: true }) }),
    );

    expect(resolved.kind).toBe('refused');
    expect(resolved.kind === 'refused' && resolved.error.message).toContain(
      'subtotal',
    );
  });

  it('refuses a path naming fewer keys than the view was grouped by', async () => {
    const resolved = await resolveOrdersPageRead(
      paramsFor({
        group: groupToken({ keys: ['shipping_country', 'status'] }),
      }),
    );

    expect(resolved.kind).toBe('refused');
  });

  it('counts a group read on its first page only', async () => {
    // The drill translation sets `includeTotal: false` because it served one
    // page beside a group row that already stated the count. This read pages,
    // so it has to say how far it goes — and only the first page pays for it.
    const first = await resolveOrdersPageRead(
      paramsFor({ group: groupToken(), skip: '0' }),
    );
    const second = await resolveOrdersPageRead(
      paramsFor({ group: groupToken(), skip: '25' }),
    );

    expect(first.kind === 'read' && first.read.includeTotal).toBe(true);
    expect(second.kind === 'read' && second.read.includeTotal).toBe(false);
    expect(second.kind === 'read' && second.read.offset).toBe(25);
  });

  it('keeps the view filters under the group keys', async () => {
    // A group row is computed under the view's filters, so a read that dropped
    // them would open on a larger set than the count it was offered beside.
    const resolved = await resolveOrdersPageRead(
      paramsFor({
        filter: JSON.stringify({
          status: { operator: 'equals', type: 'text', value: 'shipped' },
        }),
        group: groupToken(),
      }),
    );

    expect(resolved.kind === 'read' && resolved.read.filters).toStrictEqual([
      { column: 'status', operator: 'eq', value: 'shipped' },
      { column: 'shipping_country', operator: 'eq', value: 'France' },
    ]);
  });
});
