import { describe, expect, it, vi } from 'vite-plus/test';

import {
  ENTERPRISE_ORDER_PRIMARY_KEY,
  MAX_ENTERPRISE_ORDERS_LIMIT,
} from '../config';
import { resolveOrdersPageRead } from './resolveOrdersPageRead.util';

vi.mock('./enterpriseOrders.service', () => ({
  selectOrderGroupKeyTruncations: vi.fn(async () => ({})),
}));

/**
 * The resolution itself is tested in `@lcabrera/server` — this asserts only what
 * the route supplies: its two constants, and that `/paginated`'s own fetch
 * vocabulary reaches them. Both constants are read from the config rather than
 * written as literals, so the test tracks a change to either (ADR-082).
 */
const GROUP_TOKEN = JSON.stringify({
  isSubtotal: false,
  keys: ['shipping_country'],
  path: [{ columnKey: 'shipping_country', value: 'France' }],
});

const paramsFor = (entries: Record<string, string>) =>
  new URLSearchParams({ limit: '25', skip: '0', ...entries });

describe('resolveOrdersPageRead', () => {
  it('scopes the read to a group named in the fetch params', async () => {
    const resolved = await resolveOrdersPageRead(
      paramsFor({ group: GROUP_TOKEN }),
    );

    expect(resolved.kind === 'read' && resolved.read.filters).toStrictEqual([
      { column: 'shipping_country', operator: 'eq', value: 'France' },
    ]);
  });

  it('reads the whole table when no group is named', async () => {
    const resolved = await resolveOrdersPageRead(paramsFor({ skip: '50' }));

    expect(resolved.kind === 'read' && resolved.read).toMatchObject({
      includeTotal: false,
      limit: 25,
      offset: 50,
    });
  });

  it('clamps a group page to this route’s ceiling', async () => {
    const resolved = await resolveOrdersPageRead(
      paramsFor({
        group: GROUP_TOKEN,
        limit: String(MAX_ENTERPRISE_ORDERS_LIMIT + 1),
      }),
    );

    expect(resolved.kind === 'read' && resolved.read.limit).toBe(
      MAX_ENTERPRISE_ORDERS_LIMIT,
    );
  });

  it('breaks ties on this route’s primary key', async () => {
    const resolved = await resolveOrdersPageRead(
      paramsFor({ group: GROUP_TOKEN }),
    );

    expect(resolved.kind === 'read' && resolved.read.sort.at(-1)).toEqual({
      column: ENTERPRISE_ORDER_PRIMARY_KEY,
      direction: 'asc',
    });
  });

  it('refuses an unreadable group token instead of reading the whole table', async () => {
    const resolved = await resolveOrdersPageRead(
      paramsFor({ group: 'not json' }),
    );

    expect(resolved.kind).toBe('refused');
  });
});
