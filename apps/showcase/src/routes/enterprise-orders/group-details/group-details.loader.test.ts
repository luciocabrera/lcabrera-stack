import type { LoaderFunctionArgs } from 'react-router';

import { encodeDrillGroup } from '@lcabrera/api/olap/encode-drill-group.util';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { selectOrdersPage } from '../.server/enterpriseOrders.service';
import {
  COLUMNS,
  GROUP_DETAILS_PERSISTENCE_KEY,
} from '../EnterpriseOrders.constants';
import { loader } from './group-details.loader';

vi.mock('../.server/enterpriseOrders.service', () => ({
  selectOrderGroupKeyTruncations: vi.fn(async () => ({})),
  selectOrdersPage: vi.fn(async () => ({ data: [], hasMore: false, total: 0 })),
}));

/**
 * The group this modal is opened for, as the link writes it: three complete keys,
 * no subtotal.
 */
const GROUP_PATH = [
  { columnKey: 'product_category', value: 'Automotive' },
  { columnKey: 'product_subcategory', value: 'Exterior' },
  { columnKey: 'customer_type', value: 'Business' },
] as const;

const groupToken = encodeDrillGroup({
  group: { isSubtotal: false, path: GROUP_PATH },
  groupKeys: GROUP_PATH.map((entry) => entry.columnKey),
});

/**
 * A layout this modal was left in on some earlier drill, in the versioned envelope
 * the persist-cookie action writes and the loader reads back.
 */
const layoutCookie = ({
  slice,
  value,
}: {
  readonly slice: string;
  readonly value: unknown;
}) =>
  `table-state-showcase-${GROUP_DETAILS_PERSISTENCE_KEY}-${slice}=${encodeURIComponent(
    JSON.stringify({ value, version: 1 }),
  )}`;

type InvokeArgs = {
  readonly cookie?: string;
  readonly group?: string;
};

const invoke = async ({ cookie, group = groupToken }: InvokeArgs = {}) =>
  loader({
    request: new Request(
      `http://localhost/enterprise-orders/group?group=${encodeURIComponent(group)}`,
      { headers: cookie === undefined ? undefined : { cookie } },
    ),
  } as LoaderFunctionArgs);

describe('group-details loader', () => {
  beforeEach(() => {
    vi.mocked(selectOrdersPage).mockClear();
  });

  // A drill is a look at one group's rows, not a view a reader keeps. Before
  // this, the layout came out of the modal's own cookie, so an order shaped on
  // some earlier, unrelated drill decided what this one showed first.
  describe('column layout', () => {
    it('opens at the declared columns whatever the persisted layout holds', async () => {
      const result = await invoke({
        cookie: [
          layoutCookie({
            slice: 'columnOrder',
            value: ['order_status', 'order_id'],
          }),
          layoutCookie({
            slice: 'columnPinning',
            value: { left: ['order_status'], right: [] },
          }),
          layoutCookie({ slice: 'columnSizing', value: { order_id: 400 } }),
          layoutCookie({ slice: 'columnVisibility', value: ['order_number'] }),
        ].join('; '),
      });

      expect(result.metaState.isColumnLayoutTransient).toBe(true);
      expect(result.columnsState.columnOrder).toEqual([]);
      expect(result.columnsState.columnPinning).toEqual({
        left: [],
        right: [],
      });
      expect(result.columnsState.columnSizing).toEqual({});
      expect(result.columnsState.columnVisibility).toEqual(new Set());
    });

    it('paints the declared list, in declared order, with order_id first', async () => {
      // The declared order is the whole claim: nothing here reorders it, so the
      // first painted column is the first COLUMNS names.
      const result = await invoke({
        cookie: layoutCookie({
          slice: 'columnOrder',
          value: ['order_status', 'order_id'],
        }),
      });

      expect(result.columnsState.columns.map((column) => column.key)).toEqual(
        COLUMNS.map((column) => column.key),
      );
      expect(result.columnsState.columns[0]?.key).toBe('order_id');
    });
  });

  describe('locked filters', () => {
    it('states one entry per group key, with its column label and value', async () => {
      const result = await invoke();

      expect(result.metaState.lockedFilters).toEqual({
        entries: [
          {
            columnKey: 'product_category',
            label: 'Category',
            value: 'Automotive',
          },
          {
            columnKey: 'product_subcategory',
            label: 'Subcategory',
            value: 'Exterior',
          },
          {
            columnKey: 'customer_type',
            label: 'Customer Type',
            value: 'Business',
          },
        ],
      });
    });

    it('reads the token this request carries, never one a previous read saw', async () => {
      // The route has no group row in hand — the link may have been pasted into
      // a fresh tab — so the URL is the only statement of the group, and every
      // request has to be answered from its own.
      await invoke();

      const second = await invoke({
        group: encodeDrillGroup({
          group: {
            isSubtotal: false,
            path: [{ columnKey: 'shipping_country', value: 'France' }],
          },
          groupKeys: ['shipping_country'],
        }),
      });

      expect(second.metaState.lockedFilters).toEqual({
        entries: [
          {
            columnKey: 'shipping_country',
            label: 'Ship Country',
            value: 'France',
          },
        ],
      });
    });

    it('states why an unreadable token could not be read, rather than nothing', async () => {
      // An empty entry list would read as "no filters applied", which on a route
      // that refuses this very request says the rows are unrestricted.
      const result = await invoke({ group: 'not a token' });

      expect(result.metaState.lockedFilters?.entries).toEqual([]);
      expect(result.metaState.lockedFilters?.refusal).toContain(
        'does not name a group',
      );
    });

    it('adds no ColumnFilter, and leaves the token scoping the read', async () => {
      // ADR-087 decision 4: the group travels as a token, and the entries are a
      // statement rather than the mechanism. `toDrillRead` still turns it into
      // the read's own query terms — which is why the entries must not become
      // `ColumnFilter`s: a key truncated to a month is a half-open range, and
      // the filter vocabulary's `between` maps to `gte`/`lte`.
      const result = await invoke();

      expect(result.columnsState.columnFilters).toEqual({});
      expect(vi.mocked(selectOrdersPage).mock.calls[0]?.[0].filters).toEqual([
        { column: 'product_category', operator: 'eq', value: 'Automotive' },
        { column: 'product_subcategory', operator: 'eq', value: 'Exterior' },
        { column: 'customer_type', operator: 'eq', value: 'Business' },
      ]);
    });

    it('refuses the read rather than serving the whole table on a bad token', async () => {
      // The panel's refusal and the grid's are two readings of one decision:
      // `resolveGroupRead` answers `refused`, so no page is selected at all.
      await invoke({ group: 'not a token' });

      expect(vi.mocked(selectOrdersPage)).not.toHaveBeenCalled();
    });
  });
});
