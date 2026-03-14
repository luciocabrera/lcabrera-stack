import * as stylex from '@stylexjs/stylex';
import { Link, useLoaderData } from 'react-router';

import type { EnterpriseOrder } from '@/services';

import { Button } from '@/components/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/Card';

import type { loader } from './order-detail.loader';
import type { FieldConfig } from './OrderDetail.types';

import { styles } from './OrderDetail.stylex';

const ORDER_INFO_FIELDS: FieldConfig[] = [
  { key: 'order_id', label: 'Order ID' },
  { key: 'order_number', label: 'Order Number' },
  { format: 'date', key: 'order_date', label: 'Order Date' },
  { key: 'order_status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { format: 'boolean', key: 'is_rush_order', label: 'Rush Order' },
  { format: 'boolean', key: 'is_gift', label: 'Gift' },
];

const CUSTOMER_FIELDS: FieldConfig[] = [
  { key: 'customer_name', label: 'Name' },
  { key: 'customer_email', label: 'Email' },
  { key: 'customer_phone', label: 'Phone' },
  { key: 'customer_type', label: 'Type' },
  { format: 'boolean', key: 'is_vip_customer', label: 'VIP' },
  { key: 'loyalty_points', label: 'Loyalty Points' },
  { format: 'date', key: 'customer_since', label: 'Customer Since' },
];

const FINANCIAL_FIELDS: FieldConfig[] = [
  { format: 'currency', key: 'subtotal', label: 'Subtotal' },
  { format: 'currency', key: 'tax_amount', label: 'Tax' },
  { format: 'currency', key: 'shipping_cost', label: 'Shipping' },
  { format: 'currency', key: 'discount_amount', label: 'Discount' },
  { key: 'discount_percentage', label: 'Discount %' },
  { format: 'currency', key: 'total_amount', label: 'Total' },
  { format: 'currency', key: 'paid_amount', label: 'Paid' },
  { format: 'currency', key: 'balance_due', label: 'Balance Due' },
];

const PAYMENT_FIELDS: FieldConfig[] = [
  { key: 'payment_method', label: 'Method' },
  { key: 'payment_status', label: 'Status' },
  { format: 'date', key: 'payment_date', label: 'Payment Date' },
  { key: 'payment_reference', label: 'Reference' },
];

const PRODUCT_FIELDS: FieldConfig[] = [
  { key: 'product_category', label: 'Category' },
  { key: 'product_subcategory', label: 'Subcategory' },
  { key: 'quantity', label: 'Quantity' },
  { format: 'currency', key: 'unit_price', label: 'Unit Price' },
  { key: 'weight_kg', label: 'Weight (kg)' },
  { key: 'volume_m3', label: 'Volume (m³)' },
];

const SHIPPING_ADDRESS_FIELDS: FieldConfig[] = [
  { key: 'shipping_address_line1', label: 'Address' },
  { key: 'shipping_address_line2', label: 'Address Line 2' },
  { key: 'shipping_city', label: 'City' },
  { key: 'shipping_state', label: 'State' },
  { key: 'shipping_postal_code', label: 'Postal Code' },
  { key: 'shipping_country', label: 'Country' },
];

const BILLING_ADDRESS_FIELDS: FieldConfig[] = [
  { key: 'billing_address_line1', label: 'Address' },
  { key: 'billing_city', label: 'City' },
  { key: 'billing_state', label: 'State' },
  { key: 'billing_postal_code', label: 'Postal Code' },
  { key: 'billing_country', label: 'Country' },
];

const FULFILLMENT_FIELDS: FieldConfig[] = [
  { key: 'warehouse_location', label: 'Warehouse' },
  { key: 'tracking_number', label: 'Tracking #' },
  { key: 'carrier', label: 'Carrier' },
  { key: 'estimated_delivery_days', label: 'Est. Delivery Days' },
  { format: 'date', key: 'shipped_date', label: 'Shipped Date' },
  { format: 'date', key: 'delivery_date', label: 'Delivery Date' },
  { format: 'boolean', key: 'requires_signature', label: 'Requires Signature' },
  { format: 'boolean', key: 'is_fragile', label: 'Fragile' },
];

const getStatusBadgeStyle = (status: string) => {
  switch (status.toLowerCase()) {
    case 'cancelled':
    case 'refunded':
    case 'returned': {
      return styles.badgeCancelled;
    }
    case 'delivered': {
      return styles.badgeDelivered;
    }
    case 'on hold':
    case 'pending': {
      return styles.badgePending;
    }
    case 'processing':
    case 'shipped': {
      return styles.badgeShipped;
    }
    default: {
      return styles.badgeDefault;
    }
  }
};

const formatValue = (
  value: boolean | null | number | string | undefined,
  format?: 'boolean' | 'currency' | 'date',
): string => {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  switch (format) {
    case 'boolean': {
      return value === true || value === 'true' ? 'Yes' : 'No';
    }
    case 'currency': {
      const num = Number(value);
      return Number.isNaN(num)
        ? String(value)
        : new Intl.NumberFormat('en-US', {
            currency: 'USD',
            style: 'currency',
          }).format(num);
    }
    case 'date': {
      const date = new Date(String(value));
      return Number.isNaN(date.getTime())
        ? String(value)
        : date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });
    }
    default: {
      return String(value);
    }
  }
};

const Field = ({ format, label, value }: { format?: FieldConfig['format']; label: string; value: boolean | null | number | string | undefined }) => {
  const formatted = formatValue(value, format);
  const isEmpty = formatted === '—';

  return (
    <div {...stylex.props(styles.field)}>
      <span {...stylex.props(styles.fieldLabel)}>{label}</span>
      <span {...stylex.props(styles.fieldValue, isEmpty && styles.emptyValue)}>
        {formatted}
      </span>
    </div>
  );
};

const FieldSection = ({
  fields,
  order,
  title,
}: {
  fields: FieldConfig[];
  order: EnterpriseOrder;
  title: string;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardBody>
      <div {...stylex.props(styles.fieldGroup)}>
        {fields.map((field) => (
          <Field
            format={field.format}
            key={field.key}
            label={field.label}
            value={order[field.key]}
          />
        ))}
      </div>
    </CardBody>
  </Card>
);

const NotesSection = ({ order }: { order: EnterpriseOrder }) => {
  const hasOrderNotes = order.order_notes !== null && order.order_notes !== '';
  const hasInternalNotes =
    order.internal_notes !== null && order.internal_notes !== '';

  if (!hasOrderNotes && !hasInternalNotes) {
    return;
  }

  return (
    <div {...stylex.props(styles.fullWidth)}>
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardBody>
          <div {...stylex.props(styles.fieldGroup)}>
            {hasOrderNotes && (
              <div {...stylex.props(styles.field)}>
                <span {...stylex.props(styles.fieldLabel)}>Order Notes</span>
                <p {...stylex.props(styles.notesText)}>
                  {order.order_notes}
                </p>
              </div>
            )}
            {hasInternalNotes && (
              <div {...stylex.props(styles.field)}>
                <span {...stylex.props(styles.fieldLabel)}>
                  Internal Notes
                </span>
                <p {...stylex.props(styles.notesText)}>
                  {order.internal_notes}
                </p>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export const OrderDetail = () => {
  const { order } = useLoaderData<typeof loader>();

  return (
    <div {...stylex.props(styles.container)}>
      <div {...stylex.props(styles.header)}>
        <div {...stylex.props(styles.headerLeft)}>
          <h1 {...stylex.props(styles.orderNumber)}>
            Order #{order.order_number}
          </h1>
          <span
            {...stylex.props(
              styles.badge,
              getStatusBadgeStyle(order.order_status),
            )}
          >
            {order.order_status}
          </span>
        </div>
        <Link to='/enterprise-orders' {...stylex.props(styles.backLink)}>
          <Button color='outline' size='sm'>
            ← Back to Orders
          </Button>
        </Link>
      </div>

      <div {...stylex.props(styles.grid)}>
        <FieldSection
          fields={ORDER_INFO_FIELDS}
          order={order}
          title='Order Information'
        />
        <FieldSection
          fields={CUSTOMER_FIELDS}
          order={order}
          title='Customer'
        />
        <FieldSection
          fields={FINANCIAL_FIELDS}
          order={order}
          title='Financial'
        />
        <FieldSection fields={PAYMENT_FIELDS} order={order} title='Payment' />
        <FieldSection fields={PRODUCT_FIELDS} order={order} title='Product' />
        <FieldSection
          fields={FULFILLMENT_FIELDS}
          order={order}
          title='Fulfillment'
        />
        <FieldSection
          fields={SHIPPING_ADDRESS_FIELDS}
          order={order}
          title='Shipping Address'
        />
        <FieldSection
          fields={BILLING_ADDRESS_FIELDS}
          order={order}
          title='Billing Address'
        />
        <NotesSection order={order} />
      </div>
    </div>
  );
};
