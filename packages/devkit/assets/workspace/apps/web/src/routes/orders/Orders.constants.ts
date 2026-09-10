/**
 * The columns this route declares, and why each one turns sorting and
 * filtering off.
 *
 * Both are resolved where the page is read, not in the browser: the table
 * submits them and renders whatever page comes back. This route reads from rows
 * the module holds, so there is no read to apply them to, and a header offering
 * them would take a click and change nothing. They come back on when the page
 * behind the route can answer them — the rung whose loader reads from a
 * database — and dropping the two flags from a column is what turns them on,
 * because the library's own default is on.
 */

import type { TableColumn } from '@lcabrera/ui/components/Table/Table.types';

import type { Order } from './orders.types';

export const PERSISTENCE_KEY = 'orders-table';

export const TABLE_NAME = 'orders';

export const TITLE = {
  plural: 'Orders',
  singular: 'Order',
};

export const PAGE_LIMIT = 100;

export const COLUMNS: TableColumn<Order>[] = [
  {
    dataType: 'number',
    isFilterable: false,
    isPrimaryKey: true,
    isSortable: false,
    key: 'orderId',
    label: 'Order',
    maxWidth: 140,
    minWidth: 90,
  },
  {
    dataType: 'string',
    isFilterable: false,
    isSortable: false,
    key: 'customer',
    label: 'Customer',
    maxWidth: 320,
    minWidth: 160,
  },
  {
    dataType: 'string',
    isFilterable: false,
    isSortable: false,
    key: 'status',
    label: 'Status',
    maxWidth: 180,
    minWidth: 110,
  },
  {
    dataType: 'number',
    isFilterable: false,
    isSortable: false,
    key: 'quantity',
    label: 'Quantity',
    maxWidth: 140,
    minWidth: 90,
  },
  {
    dataType: 'currency',
    isFilterable: false,
    isSortable: false,
    key: 'unitPrice',
    label: 'Unit Price',
    maxWidth: 180,
    minWidth: 120,
  },
  {
    dataType: 'currency',
    isFilterable: false,
    isSortable: false,
    key: 'total',
    label: 'Total',
    maxWidth: 180,
    minWidth: 120,
  },
  {
    dataType: 'date',
    isFilterable: false,
    isSortable: false,
    key: 'orderedOn',
    label: 'Ordered On',
    maxWidth: 200,
    minWidth: 130,
  },
];
