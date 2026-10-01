/**
 * The table this route serves, and the columns it shows. The read accepts
 * exactly these columns, so every one of them offers sorting and filtering:
 * the loader hands both to the query and Postgres resolves them. A column added
 * here becomes sortable and filterable in the same edit, because the library's
 * default for both is on.
 */

import type { TablePageTarget } from '@lcabrera/server/table-page/table-page.types';
import type {
  TableColumn,
  TableCrudConfig,
} from '@lcabrera/ui/components/Table/Table.types';

import type { OrderRow } from './orders.types';

export const PERSISTENCE_KEY = 'orders-table';

export const GROUP_PERSISTENCE_KEY = 'orders-group-table';

export const SCHEMA_NAME = 'public';

export const TABLE_NAME = 'enterprise_orders';

export const TITLE = {
  plural: 'Orders',
  singular: 'Order',
};

export const PAGE_LIMIT = 100;

export const ORDERS_PATH = '/';

export const GROUP_PATH = '/group';

export const PAGE_PATH = '/_api/orders/page';

export const DELETE_PATH = '/_action/orders/delete';

export const CRUD: TableCrudConfig = { delete: true };

export const COLUMNS: TableColumn<OrderRow>[] = [
  {
    dataType: 'number',
    isPrimaryKey: true,
    key: 'order_id',
    label: 'Order ID',
    maxWidth: 120,
    minWidth: 90,
  },
  {
    dataType: 'string',
    key: 'order_number',
    label: 'Order #',
    maxWidth: 180,
    minWidth: 130,
  },
  {
    dataType: 'date',
    key: 'order_date',
    label: 'Ordered On',
    maxWidth: 160,
    minWidth: 120,
  },
  {
    dataType: 'string',
    key: 'order_status',
    label: 'Status',
    maxWidth: 160,
    minWidth: 110,
  },
  {
    dataType: 'string',
    key: 'priority',
    label: 'Priority',
    maxWidth: 140,
    minWidth: 100,
  },
  {
    dataType: 'string',
    key: 'customer_name',
    label: 'Customer',
    maxWidth: 260,
    minWidth: 150,
  },
  {
    dataType: 'string',
    key: 'customer_type',
    label: 'Customer Type',
    maxWidth: 180,
    minWidth: 130,
  },
  {
    dataType: 'string',
    key: 'product_category',
    label: 'Category',
    maxWidth: 180,
    minWidth: 120,
  },
  {
    dataType: 'number',
    key: 'quantity',
    label: 'Quantity',
    maxWidth: 130,
    minWidth: 90,
  },
  {
    dataType: 'currency',
    key: 'unit_price',
    label: 'Unit Price',
    maxWidth: 160,
    minWidth: 110,
  },
  {
    dataType: 'currency',
    key: 'total_amount',
    label: 'Total',
    maxWidth: 170,
    minWidth: 120,
  },
  {
    dataType: 'string',
    key: 'payment_status',
    label: 'Payment',
    maxWidth: 160,
    minWidth: 110,
  },
  {
    dataType: 'string',
    key: 'shipping_country',
    label: 'Ship Country',
    maxWidth: 180,
    minWidth: 120,
  },
];

export const TARGET: TablePageTarget = {
  allowedColumns: COLUMNS.map((column) => String(column.key)),
  schema: SCHEMA_NAME,
  table: TABLE_NAME,
};
