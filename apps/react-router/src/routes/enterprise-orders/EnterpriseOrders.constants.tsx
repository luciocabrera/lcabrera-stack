import { Link } from 'react-router';

import type {
  ColumnPinningState,
  TableColumn,
} from '@/components/Table/Table.types';

import { Button } from '@/components/Button';
import { EyeIcon } from '@/components/Icons';
import { ICON_SIZE_XS } from '@/design-system/constants/iconSizes.constants';
import { type EnterpriseOrder, enterpriseOrdersApi } from '@/services';
import {
  createDistinctFilterOptions,
  createStaticFilterOptions,
} from '@/utils/filters';

type DistinctStringColumnArgs = {
  readonly columnName: keyof EnterpriseOrder;
  readonly key: keyof EnterpriseOrder;
  readonly label: string;
  readonly maxWidth: number;
  readonly minWidth: number;
};

type BasicColumnArgs = {
  readonly dataType: 'boolean' | 'currency' | 'date' | 'number' | 'string';
  readonly key: keyof EnterpriseOrder;
  readonly label: string;
  readonly maxWidth: number;
  readonly minWidth: number;
};

const createDistinctStringColumn = ({
  columnName,
  key,
  label,
  maxWidth,
  minWidth,
}: DistinctStringColumnArgs): TableColumn<EnterpriseOrder> => {
  return {
    dataType: 'string',
    ...createDistinctFilterOptions<EnterpriseOrder>({
      columnName,
      fetchDistinctValues: enterpriseOrdersApi.fetchDistinctValues,
    }),
    key,
    label,
    maxWidth,
    minWidth,
  };
};

const createBasicColumn = ({
  dataType,
  key,
  label,
  maxWidth,
  minWidth,
}: BasicColumnArgs): TableColumn<EnterpriseOrder> => {
  return {
    dataType,
    key,
    label,
    maxWidth,
    minWidth,
  };
};

export const PERSISTENCE_KEY = 'enterprise-orders-table';

export const DEFAULT_COLUMN_PINNING: ColumnPinningState<EnterpriseOrder> = {
  left: [],
  right: ['actions'],
};

export const COLUMNS: TableColumn<EnterpriseOrder>[] = [
  createBasicColumn({
    dataType: 'number',
    key: 'order_id',
    label: 'Order ID',
    maxWidth: 120,
    minWidth: 90,
  }),
  createDistinctStringColumn({
    columnName: 'order_number',
    key: 'order_number',
    label: 'Order #',
    maxWidth: 180,
    minWidth: 130,
  }),
  createBasicColumn({
    dataType: 'date',
    key: 'order_date',
    label: 'Order Date',
    maxWidth: 150,
    minWidth: 120,
  }),
  {
    dataType: 'string',
    ...createStaticFilterOptions<EnterpriseOrder>([
      'Cancelled',
      'Delivered',
      'On Hold',
      'Pending',
      'Processing',
      'Refunded',
      'Returned',
      'Shipped',
    ]),
    key: 'order_status',
    label: 'Status',
    maxWidth: 150,
    minWidth: 110,
  },
  {
    dataType: 'string',
    ...createStaticFilterOptions<EnterpriseOrder>([
      'Critical',
      'High',
      'Low',
      'Normal',
      'Urgent',
    ]),
    key: 'priority',
    label: 'Priority',
    maxWidth: 130,
    minWidth: 100,
  },
  createBasicColumn({
    dataType: 'string',
    key: 'customer_name',
    label: 'Customer',
    maxWidth: 250,
    minWidth: 150,
  }),
  createDistinctStringColumn({
    columnName: 'customer_email',
    key: 'customer_email',
    label: 'Email',
    maxWidth: 280,
    minWidth: 180,
  }),
  createDistinctStringColumn({
    columnName: 'customer_type',
    key: 'customer_type',
    label: 'Customer Type',
    maxWidth: 180,
    minWidth: 130,
  }),
  createBasicColumn({
    dataType: 'boolean',
    key: 'is_vip_customer',
    label: 'VIP',
    maxWidth: 100,
    minWidth: 70,
  }),
  createBasicColumn({
    dataType: 'number',
    key: 'loyalty_points',
    label: 'Loyalty Points',
    maxWidth: 150,
    minWidth: 120,
  }),
  createBasicColumn({
    dataType: 'currency',
    key: 'total_amount',
    label: 'Total Amount',
    maxWidth: 180,
    minWidth: 130,
  }),
  createBasicColumn({
    dataType: 'currency',
    key: 'subtotal',
    label: 'Subtotal',
    maxWidth: 150,
    minWidth: 110,
  }),
  createBasicColumn({
    dataType: 'currency',
    key: 'tax_amount',
    label: 'Tax',
    maxWidth: 130,
    minWidth: 100,
  }),
  createBasicColumn({
    dataType: 'currency',
    key: 'shipping_cost',
    label: 'Shipping',
    maxWidth: 130,
    minWidth: 100,
  }),
  createBasicColumn({
    dataType: 'currency',
    key: 'discount_amount',
    label: 'Discount',
    maxWidth: 130,
    minWidth: 100,
  }),
  {
    dataType: 'string',
    ...createStaticFilterOptions<EnterpriseOrder>([
      'Cancelled',
      'Failed',
      'Paid',
      'Partially Paid',
      'Pending',
      'Refunded',
    ]),
    key: 'payment_status',
    label: 'Payment Status',
    maxWidth: 160,
    minWidth: 130,
  },
  {
    dataType: 'string',
    ...createStaticFilterOptions<EnterpriseOrder>([
      'Bank Transfer',
      'Cash',
      'Check',
      'Credit Card',
      'Cryptocurrency',
      'Debit Card',
      'PayPal',
    ]),
    key: 'payment_method',
    label: 'Payment Method',
    maxWidth: 180,
    minWidth: 140,
  },
  createBasicColumn({
    dataType: 'string',
    key: 'product_category',
    label: 'Category',
    maxWidth: 220,
    minWidth: 140,
  }),
  createBasicColumn({
    dataType: 'string',
    key: 'product_subcategory',
    label: 'Subcategory',
    maxWidth: 180,
    minWidth: 130,
  }),
  createBasicColumn({
    dataType: 'number',
    key: 'quantity',
    label: 'Quantity',
    maxWidth: 120,
    minWidth: 90,
  }),
  createBasicColumn({
    dataType: 'currency',
    key: 'unit_price',
    label: 'Unit Price',
    maxWidth: 150,
    minWidth: 110,
  }),
  createDistinctStringColumn({
    columnName: 'shipping_city',
    key: 'shipping_city',
    label: 'Ship City',
    maxWidth: 180,
    minWidth: 120,
  }),
  createDistinctStringColumn({
    columnName: 'shipping_state',
    key: 'shipping_state',
    label: 'Ship State',
    maxWidth: 150,
    minWidth: 110,
  }),
  createDistinctStringColumn({
    columnName: 'shipping_country',
    key: 'shipping_country',
    label: 'Ship Country',
    maxWidth: 180,
    minWidth: 130,
  }),
  createDistinctStringColumn({
    columnName: 'carrier',
    key: 'carrier',
    label: 'Carrier',
    maxWidth: 150,
    minWidth: 100,
  }),
  createDistinctStringColumn({
    columnName: 'warehouse_location',
    key: 'warehouse_location',
    label: 'Warehouse',
    maxWidth: 180,
    minWidth: 130,
  }),
  createBasicColumn({
    dataType: 'boolean',
    key: 'is_rush_order',
    label: 'Rush',
    maxWidth: 90,
    minWidth: 70,
  }),
  createBasicColumn({
    dataType: 'boolean',
    key: 'is_gift',
    label: 'Gift',
    maxWidth: 90,
    minWidth: 70,
  }),
  createBasicColumn({
    dataType: 'number',
    key: 'customer_rating',
    label: 'Rating',
    maxWidth: 110,
    minWidth: 80,
  }),
  createBasicColumn({
    dataType: 'date',
    key: 'delivery_date',
    label: 'Delivery Date',
    maxWidth: 150,
    minWidth: 130,
  }),
  createBasicColumn({
    dataType: 'date',
    key: 'shipped_date',
    label: 'Shipped Date',
    maxWidth: 150,
    minWidth: 130,
  }),
  {
    isFilterable: false,
    isHeaderHidden: true,
    isSortable: false,
    isStatic: true,
    key: 'actions',
    label: 'Actions',
    maxWidth: 24,
    minWidth: 24,
    render: (row) => (
      <Link to={`/enterprise-orders/${String(row.order_id)}`}>
        <Button
          aria-label={`View order ${String(row.order_id)}`}
          color='ghost'
          icon={<EyeIcon size={ICON_SIZE_XS} />}
          size='embedded'
          width='auto'
        />
      </Link>
    ),
  },
];
