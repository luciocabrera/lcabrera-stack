import type { OlapDrillGroup } from '@lcabrera/api/olap/olap.types';

import { describe, expect, it } from 'vite-plus/test';

import {
  ENTERPRISE_ORDER_PRIMARY_KEY,
  MAX_ENTERPRISE_ORDERS_LIMIT,
} from '../config/enterpriseOrders.constants';
import { toOrderDrillRead } from './toOrderDrillRead.util';

/**
 * The translation itself is tested in `@lcabrera/server` — this asserts only
 * what the app supplies, which is the whole of what this adapter adds. Both
 * constants are read from the config rather than written as literals, so the
 * test tracks a change to either instead of pinning today's value (ADR-081).
 */
const GROUP: OlapDrillGroup = {
  isSubtotal: false,
  path: [{ columnKey: 'shipping_country', value: 'Spain' }],
};

const drill = (limit: number) =>
  toOrderDrillRead({
    filters: [],
    group: GROUP,
    groupKeys: ['shipping_country'],
    limit,
    sort: [],
  });

describe('toOrderDrillRead', () => {
  it('breaks ties on this route’s primary key', () => {
    const result = drill(50);

    expect(
      result.kind === 'drillable' ? result.read.sort.at(-1) : undefined,
    ).toEqual({
      column: ENTERPRISE_ORDER_PRIMARY_KEY,
      direction: 'asc',
    });
  });

  it('clamps the page to this route’s ceiling', () => {
    const result = drill(MAX_ENTERPRISE_ORDERS_LIMIT + 1);

    expect(result.kind === 'drillable' ? result.read.limit : undefined).toBe(
      MAX_ENTERPRISE_ORDERS_LIMIT,
    );
  });

  it('passes a refusal through rather than answering it here', () => {
    expect(
      toOrderDrillRead({
        filters: [],
        group: { isSubtotal: true, path: [] },
        groupKeys: [],
        limit: 50,
        sort: [],
      }),
    ).toEqual({ kind: 'refused', reason: 'grand-total' });
  });
});
