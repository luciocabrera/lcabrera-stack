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
    isPrimaryKey: true,
    key: 'orderId',
    label: 'Order',
    maxWidth: 140,
    minWidth: 90,
  },
  {
    dataType: 'string',
    key: 'customer',
    label: 'Customer',
    maxWidth: 320,
    minWidth: 160,
  },
  {
    dataType: 'string',
    key: 'status',
    label: 'Status',
    maxWidth: 180,
    minWidth: 110,
  },
  {
    dataType: 'number',
    key: 'quantity',
    label: 'Quantity',
    maxWidth: 140,
    minWidth: 90,
  },
  {
    dataType: 'currency',
    key: 'unitPrice',
    label: 'Unit Price',
    maxWidth: 180,
    minWidth: 120,
  },
  {
    dataType: 'currency',
    key: 'total',
    label: 'Total',
    maxWidth: 180,
    minWidth: 120,
  },
  {
    dataType: 'date',
    key: 'orderedOn',
    label: 'Ordered On',
    maxWidth: 200,
    minWidth: 130,
  },
];
