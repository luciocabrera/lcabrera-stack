import type { TableGroupingState } from '@lcabrera/ui/components/Table/Table.types';

import { deleteRows } from '@lcabrera/server/db/delete-rows.util';
import { getMaxValue } from '@lcabrera/server/db/get-max-value.util';
import { getRowsCount } from '@lcabrera/server/db/get-rows-count.util';
import { insertRow } from '@lcabrera/server/db/insert-row.util';
import { selectGroupedRows } from '@lcabrera/server/db/select-grouped-rows.util';
import { selectRows } from '@lcabrera/server/db/select-rows.util';
import { updateRows } from '@lcabrera/server/db/update-rows.util';
import { GroupingRefusedError } from '@lcabrera/server/errors/grouping-refused.error';
import { QueryCanceledError } from '@lcabrera/server/errors/query-canceled.error';
import { beforeEach, expect, it, vi } from 'vite-plus/test';

import {
  ENTERPRISE_ORDER_GROUP_MAX_ROWS,
  ENTERPRISE_ORDER_LIST_COLUMNS,
  MAX_ENTERPRISE_ORDERS_LIMIT,
  MAX_ENTERPRISE_ORDERS_SORT_RULES,
} from '../config';
import {
  deleteOrder,
  getNextOrderId,
  insertOrder,
  selectOrderById,
  selectOrdersPage,
  updateOrder,
} from './enterpriseOrders.service';

vi.mock('@lcabrera/server/db/delete-rows.util', () => ({
  deleteRows: vi.fn(async () => []),
}));
vi.mock('@lcabrera/server/db/get-max-value.util', () => ({
  getMaxValue: vi.fn(async () => 41),
}));
vi.mock('@lcabrera/server/db/get-rows-count.util', () => ({
  getRowsCount: vi.fn(async () => 42),
}));
vi.mock('@lcabrera/server/db/insert-row.util', () => ({
  insertRow: vi.fn(async () => [{ order_id: 7 }]),
}));
vi.mock('@lcabrera/server/db/select-rows.util', () => ({
  selectRows: vi.fn(async () => [{ order_id: 7 }]),
}));
vi.mock('@lcabrera/server/db/select-grouped-rows.util', () => ({
  selectGroupedRows: vi.fn(async () => ({
    aggregates: [{ alias: 'count_rows', fn: 'count' }],
    groupingSetMasks: [0],
    keys: ['order_status'],
    maskAlias: 'group_mask',
    // Parsed rather than written as literals: a NULL group key and a bigint
    // count arriving as a string are what `pg` actually hands back, and the
    // second group exists to exercise exactly that.
    rows: JSON.parse(
      '[{"count_rows":"12","group_mask":0,"order_status":"Shipped"},{"count_rows":"3","group_mask":0,"order_status":null}]',
    ) as readonly Record<string, unknown>[],
  })),
}));
vi.mock('@lcabrera/server/db/update-rows.util', () => ({
  updateRows: vi.fn(async () => [{ order_id: 7 }]),
}));

const sortKeys = (value: object) =>
  Object.keys(value).toSorted((a, b) => a.localeCompare(b));

const NO_GROUPING: TableGroupingState = {
  aggregates: {},
  keys: [],
  mode: 'flat',
  periods: {},
};

type GroupingArgs = {
  readonly aggregates?: TableGroupingState['aggregates'];
  readonly keys: readonly string[];
  readonly mode?: TableGroupingState['mode'];
  readonly periods?: TableGroupingState['periods'];
};

const grouping = ({
  aggregates = {},
  keys,
  mode = 'flat',
  periods = {},
}: GroupingArgs): TableGroupingState => ({ aggregates, keys, mode, periods });

beforeEach(() => {
  vi.mocked(selectRows).mockClear();
  vi.mocked(getRowsCount).mockClear();
  vi.mocked(selectGroupedRows).mockClear();
});

it('selects one order by its primary key', async () => {
  const order = await selectOrderById(7);

  expect(order).toStrictEqual({ order_id: 7 });
  expect(selectRows).toHaveBeenCalledWith(
    expect.objectContaining({
      filters: [{ column: 'order_id', operator: 'eq', value: 7 }],
      limit: 1,
      schema: 'public',
      table: 'enterprise_orders',
    }),
  );
});

it('returns a page with total and hasMore from the count query', async () => {
  const page = await selectOrdersPage({
    filters: [],
    includeTotal: true,
    limit: 10,
    offset: 0,
    sort: [],
  });

  expect(page.data).toStrictEqual([{ order_id: 7 }]);
  expect(page.total).toBe(42);
  expect(page.hasMore).toBe(true);
});

it('projects the list read model, not every column of the row', async () => {
  await selectOrdersPage({
    filters: [],
    includeTotal: true,
    limit: 10,
    offset: 0,
    sort: [],
  });

  const [descriptor] = vi.mocked(selectRows).mock.calls[0] ?? [];

  expect(descriptor?.fields).toStrictEqual(ENTERPRISE_ORDER_LIST_COLUMNS);
});

it('skips the count on a load-more page and reports no total', async () => {
  const page = await selectOrdersPage({
    filters: [],
    includeTotal: false,
    limit: 10,
    offset: 50,
    sort: [],
  });

  expect(getRowsCount).not.toHaveBeenCalled();
  expect(page.total).toBeUndefined();
});

it('reports the end of the set when a page comes back short of its limit', async () => {
  const page = await selectOrdersPage({
    filters: [],
    includeTotal: false,
    limit: 10,
    offset: 50,
    sort: [],
  });

  // The mock returns one row for a limit of ten.
  expect(page.hasMore).toBe(false);
});

// The window and the ORDER BY are the two request-derived inputs that can size
// this read, and both are bounded here rather than at the resource route's
// parser — the SSR loader never passes through it (#706). Each case asks for
// more than the bound allows; without the clamps, each reaches the executor
// exactly as asked.
it('clamps a page window asked for above the ceiling', async () => {
  await selectOrdersPage({
    filters: [],
    includeTotal: true,
    limit: 999_999_999,
    offset: 0,
    sort: [],
  });

  const [descriptor] = vi.mocked(selectRows).mock.calls[0] ?? [];

  expect(descriptor?.limit).toBe(MAX_ENTERPRISE_ORDERS_LIMIT);
});

it('raises a zero window to one row', async () => {
  await selectOrdersPage({
    filters: [],
    includeTotal: false,
    limit: 0,
    offset: 0,
    sort: [],
  });

  const [descriptor] = vi.mocked(selectRows).mock.calls[0] ?? [];

  // `LIMIT 0` is a page with no rows and a `hasMore` that says the set is
  // exhausted, which ends a scroll session silently.
  expect(descriptor?.limit).toBe(1);
});

it('leaves a window and an offset the table can actually ask for untouched', async () => {
  await selectOrdersPage({
    filters: [],
    includeTotal: false,
    limit: 50,
    offset: 100,
    sort: [{ column: 'order_id', direction: 'asc' }],
  });

  const [descriptor] = vi.mocked(selectRows).mock.calls[0] ?? [];

  expect(descriptor?.limit).toBe(50);
  expect(descriptor?.offset).toBe(100);
  expect(descriptor?.sort).toStrictEqual([
    { column: 'order_id', direction: 'asc' },
  ]);
});

it('truncates a sort longer than the table has columns', async () => {
  await selectOrdersPage({
    filters: [],
    includeTotal: false,
    limit: 50,
    offset: 0,
    sort: Array.from(
      { length: MAX_ENTERPRISE_ORDERS_SORT_RULES + 25 },
      () => ({ column: 'order_id', direction: 'asc' }) as const,
    ),
  });

  const [descriptor] = vi.mocked(selectRows).mock.calls[0] ?? [];

  expect(descriptor?.sort).toHaveLength(MAX_ENTERPRISE_ORDERS_SORT_RULES);
});

it('orders a grouped read by the bounded sort too', async () => {
  await selectOrdersPage({
    filters: [],
    grouping: grouping({ keys: ['order_status'] }),
    includeTotal: true,
    limit: 50,
    offset: 0,
    sort: Array.from(
      { length: MAX_ENTERPRISE_ORDERS_SORT_RULES + 25 },
      () => ({ column: 'order_status', direction: 'desc' }) as const,
    ),
  });

  // The grouped read emits one term per key rather than one per sort entry, so
  // what the bound protects here is the lookup: it reads a sort the builder
  // would have accepted, not one that grew without limit.
  const [descriptor] = vi.mocked(selectGroupedRows).mock.calls[0] ?? [];

  expect(descriptor?.sort).toStrictEqual([
    { direction: 'desc', key: 'order_status' },
  ]);
});

it('seeks past a keyset cursor instead of applying an offset', async () => {
  await selectOrdersPage({
    cursor: [4821],
    filters: [],
    includeTotal: false,
    limit: 10,
    offset: 50,
    sort: [{ column: 'order_id', direction: 'asc' }],
  });

  const [descriptor] = vi.mocked(selectRows).mock.calls[0] ?? [];

  expect(descriptor?.cursor).toStrictEqual({
    uniqueColumn: 'order_id',
    values: [4821],
  });
  expect(descriptor?.offset).toBeUndefined();
});

it('falls back to the offset when the sort is not a total order', async () => {
  await selectOrdersPage({
    cursor: [4821, 'Acme'],
    filters: [],
    includeTotal: false,
    limit: 10,
    offset: 50,
    sort: [
      { column: 'order_id', direction: 'asc' },
      { column: 'customer_name', direction: 'asc' },
    ],
  });

  const [descriptor] = vi.mocked(selectRows).mock.calls[0] ?? [];

  expect(descriptor?.cursor).toBeUndefined();
  expect(descriptor?.offset).toBe(50);
});

it('returns the max order_id plus one', async () => {
  const next = await getNextOrderId();

  expect(next).toBe(42);
  expect(getMaxValue).toHaveBeenCalledWith(
    expect.objectContaining({ column: 'order_id', table: 'enterprise_orders' }),
  );
});

it('inserts the provided values', async () => {
  await insertOrder({ values: { customer_name: 'Ada', order_id: 7 } });

  expect(insertRow).toHaveBeenCalledWith(
    expect.objectContaining({
      table: 'enterprise_orders',
      values: { customer_name: 'Ada', order_id: 7 },
    }),
  );
});

it('updates by primary key with the provided values', async () => {
  await updateOrder({ orderId: 7, values: { customer_name: 'Grace' } });

  expect(updateRows).toHaveBeenCalledWith(
    expect.objectContaining({
      filters: [{ column: 'order_id', operator: 'eq', value: 7 }],
      values: { customer_name: 'Grace' },
    }),
  );
});

it('deletes by primary key', async () => {
  await deleteOrder(7);

  expect(deleteRows).toHaveBeenCalledWith(
    expect.objectContaining({
      filters: [{ column: 'order_id', operator: 'eq', value: 7 }],
    }),
  );
});

it('runs the ungrouped read when the loader applied no group keys', async () => {
  await selectOrdersPage({
    filters: [],
    grouping: NO_GROUPING,
    includeTotal: true,
    limit: 10,
    offset: 0,
    sort: [],
  });

  expect(selectRows).toHaveBeenCalledTimes(1);
  expect(selectGroupedRows).not.toHaveBeenCalled();
});

it('emits the rollup mode the grouping configuration asked for', async () => {
  await selectOrdersPage({
    filters: [],
    grouping: grouping({ keys: ['order_status'], mode: 'rollup' }),
    includeTotal: true,
    limit: 10,
    offset: 0,
    sort: [],
  });

  expect(selectGroupedRows).toHaveBeenCalledWith(
    expect.objectContaining({ grouping: 'rollup' }),
  );
});

it('carries a user sort on a group key into the grouped read', async () => {
  // Criterion 4 end to end: the direction has to reach the builder for the
  // hierarchy to be able to hold under it. Hard-coding `asc` here would drop a
  // user's sort silently, and the builder's own test could not see it.
  await selectOrdersPage({
    filters: [],
    grouping: grouping({ keys: ['order_status', 'shipping_country'] }),
    includeTotal: true,
    limit: 10,
    offset: 0,
    sort: [{ column: 'order_status', direction: 'desc' }],
  });

  expect(selectGroupedRows).toHaveBeenCalledWith(
    expect.objectContaining({
      // Nesting order is preserved and is not the sort's to change: the user's
      // direction sets a level, it does not reorder the levels.
      sort: [
        { direction: 'desc', key: 'order_status' },
        { direction: 'asc', key: 'shipping_country' },
      ],
    }),
  );
});

it('ignores a sort on a column the grouped read does not project', async () => {
  await selectOrdersPage({
    filters: [],
    grouping: grouping({ keys: ['order_status'] }),
    includeTotal: true,
    limit: 10,
    offset: 0,
    sort: [{ column: 'customer_name', direction: 'desc' }],
  });

  expect(selectGroupedRows).toHaveBeenCalledWith(
    expect.objectContaining({
      sort: [{ direction: 'asc', key: 'order_status' }],
    }),
  );
});

it('runs the grouped read when the loader applied a group key', async () => {
  const page = await selectOrdersPage({
    filters: [{ column: 'priority', operator: 'eq', value: 'High' }],
    grouping: grouping({ keys: ['order_status'] }),
    includeTotal: true,
    limit: 10,
    offset: 0,
    sort: [],
  });

  expect(selectRows).not.toHaveBeenCalled();
  expect(selectGroupedRows).toHaveBeenCalledWith(
    expect.objectContaining({
      aggregates: [{ fn: 'count' }],
      allowedColumns: expect.arrayContaining(['order_status']),
      filters: [{ column: 'priority', operator: 'eq', value: 'High' }],
      grouping: 'flat',
      keys: ['order_status'],
      maxRows: ENTERPRISE_ORDER_GROUP_MAX_ROWS,
      schema: 'public',
      sort: [{ direction: 'asc', key: 'order_status' }],
      table: 'enterprise_orders',
    }),
  );
  // The NULL group's two fields disagree, and that is the point of #775: it
  // renders as `(empty)` and queries as `null`. Parsed from JSON so the
  // expected `null` is the shape the driver actually hands back.
  expect(page.data).toStrictEqual(
    JSON.parse(`[
      {
        "tableGroup": {
          "aggregates": [],
          "count": 12,
          "isSubtotal": false,
          "path": [
            { "columnKey": "order_status", "label": "Shipped", "value": "Shipped" }
          ]
        }
      },
      {
        "tableGroup": {
          "aggregates": [],
          "count": 3,
          "isSubtotal": false,
          "path": [
            { "columnKey": "order_status", "label": "(empty)", "value": null }
          ]
        }
      }
    ]`),
  );
});

it('groups by several keys and sorts by each of them', async () => {
  await selectOrdersPage({
    filters: [],
    grouping: grouping({ keys: ['order_status', 'shipping_country'] }),
    includeTotal: true,
    limit: 10,
    offset: 0,
    sort: [],
  });

  expect(selectGroupedRows).toHaveBeenCalledWith(
    expect.objectContaining({
      keys: ['order_status', 'shipping_country'],
      sort: [
        { direction: 'asc', key: 'order_status' },
        { direction: 'asc', key: 'shipping_country' },
      ],
    }),
  );
});

it('requests the selected aggregates beside the row count, and never a filtered one', async () => {
  await selectOrdersPage({
    filters: [],
    grouping: grouping({
      aggregates: { total_amount: 'sum' },
      keys: ['order_status'],
    }),
    includeTotal: true,
    limit: 10,
    offset: 0,
    sort: [],
  });

  // `count(*)` first, then the selection. No `filters` on any of them: a
  // filtered aggregate has no slot in the URL param this configuration arrives
  // through, and `UnfilteredOrderAggregate` removes the slot from what this
  // service builds — so it is unrequestable here, not merely unrequested (#569).
  const [descriptor] = vi.mocked(selectGroupedRows).mock.calls.at(-1) ?? [];

  expect(descriptor?.aggregates).toStrictEqual([
    { fn: 'count' },
    { column: 'total_amount', fn: 'sum' },
  ]);
  expect(
    descriptor?.aggregates.some((aggregate) => 'filters' in aggregate),
  ).toBe(false);
});

it('returns the whole grouped result at once, because it is not paginated', async () => {
  const page = await selectOrdersPage({
    filters: [],
    grouping: grouping({ keys: ['order_status'] }),
    includeTotal: true,
    limit: 1,
    offset: 0,
    sort: [],
  });

  // `limit: 1` is deliberately smaller than the result: a grouped read has no
  // cursor to resume from, so it must not report more to come.
  expect(page.hasMore).toBe(false);
  expect(page.total).toBe(2);
  expect(page.data).toHaveLength(2);
});

it('keeps the response shape identical whether or not the read is grouped', async () => {
  const ungrouped = await selectOrdersPage({
    filters: [],
    includeTotal: true,
    limit: 10,
    offset: 0,
    sort: [],
  });
  const grouped = await selectOrdersPage({
    filters: [],
    grouping: grouping({ keys: ['order_status'] }),
    includeTotal: true,
    limit: 10,
    offset: 0,
    sort: [],
  });

  expect(sortKeys(grouped)).toStrictEqual(sortKeys(ungrouped));
});

it('maps a refusal to a plain union rather than letting the class escape', async () => {
  vi.mocked(selectGroupedRows).mockRejectedValueOnce(
    new GroupingRefusedError({
      column: 'order_id',
      estimatedRows: 500_001,
      message: 'This grouping is estimated to return 500001 rows.',
      reason: 'estimate-too-large',
    }),
  );

  const page = await selectOrdersPage({
    filters: [],
    grouping: grouping({ keys: ['order_status'] }),
    includeTotal: true,
    limit: 10,
    offset: 0,
    sort: [],
  });

  expect(page.error).toStrictEqual({
    column: 'order_id',
    estimatedRows: 500_001,
    kind: 'grouping-refused',
    message: 'This grouping is estimated to return 500001 rows.',
    reason: 'estimate-too-large',
  });
  expect(page.data).toStrictEqual([]);
});

it('maps a cancelled query to the union arm the edge branches on', async () => {
  vi.mocked(selectGroupedRows).mockRejectedValueOnce(
    new QueryCanceledError({ cause: undefined, fields: { code: '57014' } }),
  );

  const page = await selectOrdersPage({
    filters: [],
    grouping: grouping({ keys: ['order_status'] }),
    includeTotal: true,
    limit: 10,
    offset: 0,
    sort: [],
  });

  expect(page.error?.kind).toBe('db-canceled');
});

it('returns an error the single-fetch boundary cannot flatten', async () => {
  // The discriminating half: `Error.message` is non-enumerable, so returning
  // the class itself would put a payload carrying no message on the wire. The
  // union carries the same sentence as an ordinary own property.
  const refusal = new GroupingRefusedError({
    message: 'too deep',
    reason: 'too-many-keys',
  });
  vi.mocked(selectGroupedRows).mockRejectedValueOnce(refusal);

  const page = await selectOrdersPage({
    filters: [],
    grouping: grouping({ keys: ['order_status'] }),
    includeTotal: true,
    limit: 10,
    offset: 0,
    sort: [],
  });

  expect(Object.keys(refusal)).not.toContain('message');
  expect(Object.keys(page.error ?? {})).toContain('message');
  expect(structuredClone(page)).toStrictEqual(page);
});

it('carries a stats-unavailable warning beside real rows', async () => {
  vi.mocked(selectGroupedRows).mockResolvedValueOnce({
    aggregates: [{ alias: 'count_rows', fn: 'count' }],
    estimate: { columns: ['order_status'], kind: 'unknown' },
    groupingSetMasks: [0],
    keys: ['order_status'],
    maskAlias: 'group_mask',
    rows: [{ count_rows: '12', group_mask: 0, order_status: 'Shipped' }],
    truncations: {},
    warning: { columns: ['order_status'], kind: 'stats-unavailable' },
  });

  const page = await selectOrdersPage({
    filters: [],
    grouping: grouping({ keys: ['order_status'] }),
    includeTotal: true,
    limit: 10,
    offset: 0,
    sort: [],
  });

  // A warning is not an error: the data is real, and the operator learns why it
  // was expensive.
  expect(page.groupingWarning).toStrictEqual({
    columns: ['order_status'],
    kind: 'stats-unavailable',
  });
  expect(page.error).toBeUndefined();
  expect(page.data).toHaveLength(1);
});
