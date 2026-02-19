import type {
  FilterOptionsResponse,
  TableColumn,
} from '@/components/Table/Table.types';

import { type EnterpriseOrder, enterpriseOrdersApi } from '@/services';

export const PERSISTENCE_KEY = 'enterprise-orders-table';

export const COLUMNS: TableColumn<EnterpriseOrder>[] = [
  {
    dataType: 'number',
    key: 'order_id',
    label: 'Order ID',
    maxWidth: 120,
    minWidth: 90,
  },
  {
    dataType: 'string',
    fetchFilterOptions: async ({ limit, skip }) => {
      const result = await enterpriseOrdersApi.fetchDistinctValues({
        columnName: 'order_number',
        limit,
        offset: skip,
      });
      return { hasMore: result.hasMore, values: result.values };
    },
    filterOptionsDataSelector: (response: FilterOptionsResponse) =>
      response.values,
    filterOptionsDataTotalSelector: (response: FilterOptionsResponse) =>
      response.hasMore ? Infinity : response.values.length,
    key: 'order_number',
    label: 'Order #',
    maxWidth: 180,
    minWidth: 130,
  },
  {
    dataType: 'date',
    key: 'order_date',
    label: 'Order Date',
    maxWidth: 150,
    minWidth: 120,
  },
  {
    dataType: 'string',
    filterOptions: [
      'Cancelled',
      'Delivered',
      'On Hold',
      'Pending',
      'Processing',
      'Refunded',
      'Returned',
      'Shipped',
    ],
    key: 'order_status',
    label: 'Status',
    maxWidth: 150,
    minWidth: 110,
  },
  {
    dataType: 'string',
    filterOptions: ['Critical', 'High', 'Low', 'Normal', 'Urgent'],
    key: 'priority',
    label: 'Priority',
    maxWidth: 130,
    minWidth: 100,
  },
  {
    dataType: 'string',
    key: 'customer_name',
    label: 'Customer',
    maxWidth: 250,
    minWidth: 150,
  },
  {
    dataType: 'string',
    fetchFilterOptions: async ({ limit, skip }) => {
      const result = await enterpriseOrdersApi.fetchDistinctValues({
        columnName: 'customer_email',
        limit,
        offset: skip,
      });
      return { hasMore: result.hasMore, values: result.values };
    },
    filterOptionsDataSelector: (response: FilterOptionsResponse) =>
      response.values,
    filterOptionsDataTotalSelector: (response: FilterOptionsResponse) =>
      response.hasMore ? Infinity : response.values.length,
    key: 'customer_email',
    label: 'Email',
    maxWidth: 280,
    minWidth: 180,
  },
  {
    dataType: 'string',
    fetchFilterOptions: async ({ limit, skip }) => {
      const result = await enterpriseOrdersApi.fetchDistinctValues({
        columnName: 'customer_type',
        limit,
        offset: skip,
      });
      return { hasMore: result.hasMore, values: result.values };
    },
    filterOptionsDataSelector: (response: FilterOptionsResponse) =>
      response.values,
    filterOptionsDataTotalSelector: (response: FilterOptionsResponse) =>
      response.hasMore ? Infinity : response.values.length,
    key: 'customer_type',
    label: 'Customer Type',
    maxWidth: 180,
    minWidth: 130,
  },
  {
    dataType: 'boolean',
    key: 'is_vip_customer',
    label: 'VIP',
    maxWidth: 100,
    minWidth: 70,
  },
  {
    dataType: 'number',
    key: 'loyalty_points',
    label: 'Loyalty Points',
    maxWidth: 150,
    minWidth: 120,
  },
  {
    dataType: 'currency',
    key: 'total_amount',
    label: 'Total Amount',
    maxWidth: 180,
    minWidth: 130,
  },
  {
    dataType: 'currency',
    key: 'subtotal',
    label: 'Subtotal',
    maxWidth: 150,
    minWidth: 110,
  },
  {
    dataType: 'currency',
    key: 'tax_amount',
    label: 'Tax',
    maxWidth: 130,
    minWidth: 100,
  },
  {
    dataType: 'currency',
    key: 'shipping_cost',
    label: 'Shipping',
    maxWidth: 130,
    minWidth: 100,
  },
  {
    dataType: 'currency',
    key: 'discount_amount',
    label: 'Discount',
    maxWidth: 130,
    minWidth: 100,
  },
  {
    dataType: 'string',
    filterOptions: [
      'Cancelled',
      'Failed',
      'Paid',
      'Partially Paid',
      'Pending',
      'Refunded',
    ],
    key: 'payment_status',
    label: 'Payment Status',
    maxWidth: 160,
    minWidth: 130,
  },
  {
    dataType: 'string',
    filterOptions: [
      'Bank Transfer',
      'Cash',
      'Check',
      'Credit Card',
      'Cryptocurrency',
      'Debit Card',
      'PayPal',
    ],
    key: 'payment_method',
    label: 'Payment Method',
    maxWidth: 180,
    minWidth: 140,
  },
  {
    dataType: 'string',
    key: 'product_category',
    label: 'Category',
    maxWidth: 220,
    minWidth: 140,
  },
  {
    dataType: 'string',
    key: 'product_subcategory',
    label: 'Subcategory',
    maxWidth: 180,
    minWidth: 130,
  },
  {
    dataType: 'number',
    key: 'quantity',
    label: 'Quantity',
    maxWidth: 120,
    minWidth: 90,
  },
  {
    dataType: 'currency',
    key: 'unit_price',
    label: 'Unit Price',
    maxWidth: 150,
    minWidth: 110,
  },
  {
    dataType: 'string',
    fetchFilterOptions: async ({ limit, skip }) => {
      const result = await enterpriseOrdersApi.fetchDistinctValues({
        columnName: 'shipping_city',
        limit,
        offset: skip,
      });
      return { hasMore: result.hasMore, values: result.values };
    },
    filterOptionsDataSelector: (response: FilterOptionsResponse) =>
      response.values,
    filterOptionsDataTotalSelector: (response: FilterOptionsResponse) =>
      response.hasMore ? Infinity : response.values.length,
    key: 'shipping_city',
    label: 'Ship City',
    maxWidth: 180,
    minWidth: 120,
  },
  {
    dataType: 'string',
    fetchFilterOptions: async ({ limit, skip }) => {
      const result = await enterpriseOrdersApi.fetchDistinctValues({
        columnName: 'shipping_state',
        limit,
        offset: skip,
      });
      return { hasMore: result.hasMore, values: result.values };
    },
    filterOptionsDataSelector: (response: FilterOptionsResponse) =>
      response.values,
    filterOptionsDataTotalSelector: (response: FilterOptionsResponse) =>
      response.hasMore ? Infinity : response.values.length,
    key: 'shipping_state',
    label: 'Ship State',
    maxWidth: 150,
    minWidth: 110,
  },
  {
    dataType: 'string',
    fetchFilterOptions: async ({ limit, skip }) => {
      const result = await enterpriseOrdersApi.fetchDistinctValues({
        columnName: 'shipping_country',
        limit,
        offset: skip,
      });
      return { hasMore: result.hasMore, values: result.values };
    },
    filterOptionsDataSelector: (response: FilterOptionsResponse) =>
      response.values,
    filterOptionsDataTotalSelector: (response: FilterOptionsResponse) =>
      response.hasMore ? Infinity : response.values.length,
    key: 'shipping_country',
    label: 'Ship Country',
    maxWidth: 180,
    minWidth: 130,
  },
  {
    dataType: 'string',
    fetchFilterOptions: async ({ limit, skip }) => {
      const result = await enterpriseOrdersApi.fetchDistinctValues({
        columnName: 'carrier',
        limit,
        offset: skip,
      });
      return { hasMore: result.hasMore, values: result.values };
    },
    filterOptionsDataSelector: (response: FilterOptionsResponse) =>
      response.values,
    filterOptionsDataTotalSelector: (response: FilterOptionsResponse) =>
      response.hasMore ? Infinity : response.values.length,
    key: 'carrier',
    label: 'Carrier',
    maxWidth: 150,
    minWidth: 100,
  },
  {
    dataType: 'string',
    fetchFilterOptions: async ({ limit, skip }) => {
      const result = await enterpriseOrdersApi.fetchDistinctValues({
        columnName: 'warehouse_location',
        limit,
        offset: skip,
      });
      return { hasMore: result.hasMore, values: result.values };
    },
    filterOptionsDataSelector: (response: FilterOptionsResponse) =>
      response.values,
    filterOptionsDataTotalSelector: (response: FilterOptionsResponse) =>
      response.hasMore ? Infinity : response.values.length,
    key: 'warehouse_location',
    label: 'Warehouse',
    maxWidth: 180,
    minWidth: 130,
  },
  {
    dataType: 'boolean',
    key: 'is_rush_order',
    label: 'Rush',
    maxWidth: 90,
    minWidth: 70,
  },
  {
    dataType: 'boolean',
    key: 'is_gift',
    label: 'Gift',
    maxWidth: 90,
    minWidth: 70,
  },
  {
    dataType: 'number',
    key: 'customer_rating',
    label: 'Rating',
    maxWidth: 110,
    minWidth: 80,
  },
  {
    dataType: 'date',
    key: 'delivery_date',
    label: 'Delivery Date',
    maxWidth: 150,
    minWidth: 130,
  },
  {
    dataType: 'date',
    key: 'shipped_date',
    label: 'Shipped Date',
    maxWidth: 150,
    minWidth: 130,
  },
];
