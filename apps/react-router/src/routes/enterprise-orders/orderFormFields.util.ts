import type { FieldNode } from '@repo/ui/components/Form';
import type { FormMode } from '@repo/ui/components/Form/Form.types';

import type { EnterpriseOrderValues } from './config';

import {
  CARRIER_VALUES,
  CUSTOMER_TYPE_VALUES,
  EMAIL_PATTERN,
  ORDER_STATUS_VALUES,
  PAYMENT_METHOD_VALUES,
  PAYMENT_STATUS_VALUES,
  PHONE_PATTERN,
  POSTAL_CODE_PATTERN,
  PRIORITY_VALUES,
  PRODUCT_CATEGORY_VALUES,
  toFieldOptions,
  WAREHOUSE_LOCATION_VALUES,
} from './config';

export type BuildOrderFormFieldsArgs = {
  readonly mode: FormMode;
};

/**
 * Build the enterprise-order Form field tree (tabs → card groups → rows) for a
 * given mode (feature plan §4). Small enum fields render as radio-cards, large
 * sets as selects, and money fields as currency. Server-assigned identity,
 * computed money totals and audit columns are read-only and only appear in
 * edit/view (create derives them on save); `view` mode renders every field
 * read-only via the Form itself.
 */
export const buildOrderFormFields = ({
  mode,
}: BuildOrderFormFieldsArgs): readonly FieldNode<EnterpriseOrderValues>[] => {
  const isCreate = mode === 'create';

  return [
    {
      tabs: [
        {
          fields: [
            {
              collapsible: false,
              fields: [
                ...(isCreate
                  ? []
                  : ([
                      {
                        accessor: 'order_number',
                        disabled: true,
                        label: 'Order Number',
                        type: 'text',
                      },
                    ] as const)),
                {
                  accessor: 'order_date',
                  clientValidation: { required: true },
                  label: 'Order Date',
                  type: 'date',
                },
                {
                  accessor: 'order_status',
                  clientValidation: { required: true },
                  label: 'Status',
                  options: toFieldOptions(ORDER_STATUS_VALUES),
                  type: 'select',
                },
                {
                  accessor: 'priority',
                  clientValidation: { required: true },
                  label: 'Priority',
                  options: toFieldOptions(PRIORITY_VALUES),
                  type: 'radio',
                },
              ],
              label: 'Summary',
              type: 'group',
            },
            {
              fields: [
                {
                  fields: [
                    {
                      accessor: 'is_rush_order',
                      label: 'Rush order',
                      type: 'boolean',
                      variant: 'toggle',
                    },
                    {
                      accessor: 'is_gift',
                      label: 'Gift',
                      type: 'boolean',
                      variant: 'toggle',
                    },
                    {
                      accessor: 'is_fragile',
                      label: 'Fragile',
                      type: 'boolean',
                      variant: 'toggle',
                    },
                    {
                      accessor: 'requires_signature',
                      label: 'Requires signature',
                      type: 'boolean',
                      variant: 'toggle',
                    },
                  ],
                  type: 'row',
                },
              ],
              label: 'Flags',
              type: 'group',
            },
          ],
          label: 'Order',
        },
        {
          fields: [
            {
              fields: [
                {
                  fields: [
                    {
                      accessor: 'customer_name',
                      clientValidation: { maxLength: 200, required: true },
                      label: 'Customer Name',
                      type: 'text',
                    },
                    {
                      accessor: 'customer_email',
                      clientValidation: {
                        pattern: EMAIL_PATTERN,
                        required: true,
                      },
                      label: 'Email',
                      type: 'email',
                    },
                  ],
                  type: 'row',
                },
                {
                  fields: [
                    {
                      accessor: 'customer_phone',
                      clientValidation: {
                        pattern: PHONE_PATTERN,
                        required: true,
                      },
                      label: 'Phone',
                      type: 'text',
                    },
                    {
                      accessor: 'customer_type',
                      clientValidation: { required: true },
                      label: 'Customer Type',
                      options: toFieldOptions(CUSTOMER_TYPE_VALUES),
                      type: 'radio',
                    },
                  ],
                  type: 'row',
                },
                {
                  accessor: 'customer_id',
                  clientValidation: { min: 1, required: true },
                  label: 'Customer ID',
                  type: 'number',
                },
              ],
              label: 'Identity',
              type: 'group',
            },
            {
              fields: [
                {
                  fields: [
                    {
                      accessor: 'is_vip_customer',
                      label: 'VIP customer',
                      type: 'boolean',
                      variant: 'toggle',
                    },
                    {
                      accessor: 'loyalty_points',
                      clientValidation: { min: 0, required: true },
                      label: 'Loyalty Points',
                      type: 'number',
                    },
                  ],
                  type: 'row',
                },
                {
                  fields: [
                    {
                      accessor: 'customer_since',
                      clientValidation: { required: true },
                      label: 'Customer Since',
                      type: 'date',
                    },
                    {
                      accessor: 'customer_rating',
                      clientValidation: { max: 5, min: 1 },
                      description: 'Optional, 1–5.',
                      label: 'Rating',
                      type: 'number',
                    },
                  ],
                  type: 'row',
                },
              ],
              label: 'Loyalty',
              type: 'group',
            },
          ],
          label: 'Customer',
        },
        {
          fields: [
            {
              fields: [
                {
                  fields: [
                    {
                      accessor: 'product_category',
                      clientValidation: { required: true },
                      label: 'Category',
                      options: toFieldOptions(PRODUCT_CATEGORY_VALUES),
                      type: 'select',
                    },
                    {
                      accessor: 'product_subcategory',
                      clientValidation: { maxLength: 100, required: true },
                      label: 'Subcategory',
                      type: 'text',
                    },
                  ],
                  type: 'row',
                },
                {
                  fields: [
                    {
                      accessor: 'quantity',
                      clientValidation: { min: 1, required: true },
                      label: 'Quantity',
                      type: 'number',
                    },
                    {
                      accessor: 'unit_price',
                      clientValidation: { min: 0, required: true },
                      label: 'Unit Price',
                      type: 'currency',
                    },
                  ],
                  type: 'row',
                },
                {
                  fields: [
                    {
                      accessor: 'weight_kg',
                      clientValidation: { min: 0, required: true },
                      label: 'Weight (kg)',
                      type: 'number',
                    },
                    {
                      accessor: 'volume_m3',
                      clientValidation: { min: 0, required: true },
                      label: 'Volume (m³)',
                      type: 'number',
                    },
                  ],
                  type: 'row',
                },
              ],
              label: 'Product',
              type: 'group',
            },
          ],
          label: 'Product',
        },
        {
          fields: [
            {
              fields: [
                {
                  fields: [
                    {
                      accessor: 'discount_percentage',
                      clientValidation: { max: 100, min: 0, required: true },
                      label: 'Discount %',
                      type: 'number',
                    },
                    {
                      accessor: 'shipping_cost',
                      clientValidation: { min: 0, required: true },
                      label: 'Shipping Cost',
                      type: 'currency',
                    },
                    {
                      accessor: 'paid_amount',
                      clientValidation: { min: 0, required: true },
                      label: 'Paid Amount',
                      type: 'currency',
                    },
                  ],
                  spans: [1, 1, 1],
                  type: 'row',
                },
              ],
              label: 'Pricing Inputs',
              type: 'group',
            },
            ...(isCreate
              ? []
              : ([
                  {
                    fields: [
                      {
                        fields: [
                          {
                            accessor: 'subtotal',
                            disabled: true,
                            label: 'Subtotal',
                            type: 'currency',
                          },
                          {
                            accessor: 'discount_amount',
                            disabled: true,
                            label: 'Discount',
                            type: 'currency',
                          },
                        ],
                        type: 'row',
                      },
                      {
                        fields: [
                          {
                            accessor: 'tax_amount',
                            disabled: true,
                            label: 'Tax',
                            type: 'currency',
                          },
                          {
                            accessor: 'total_amount',
                            disabled: true,
                            label: 'Total',
                            type: 'currency',
                          },
                        ],
                        type: 'row',
                      },
                      {
                        accessor: 'balance_due',
                        disabled: true,
                        label: 'Balance Due',
                        type: 'currency',
                      },
                    ],
                    label: 'Computed Totals',
                    type: 'group',
                  },
                ] as const)),
          ],
          label: 'Pricing',
        },
        {
          fields: [
            {
              fields: [
                {
                  fields: [
                    {
                      accessor: 'shipping_address_line1',
                      clientValidation: { maxLength: 200, required: true },
                      label: 'Address Line 1',
                      type: 'text',
                    },
                    {
                      accessor: 'shipping_address_line2',
                      clientValidation: { maxLength: 200 },
                      label: 'Address Line 2',
                      type: 'text',
                    },
                  ],
                  spans: [2, 1],
                  type: 'row',
                },
                {
                  fields: [
                    {
                      accessor: 'shipping_city',
                      clientValidation: { required: true },
                      label: 'City',
                      type: 'text',
                    },
                    {
                      accessor: 'shipping_state',
                      clientValidation: { required: true },
                      label: 'State',
                      type: 'text',
                    },
                  ],
                  type: 'row',
                },
                {
                  fields: [
                    {
                      accessor: 'shipping_country',
                      clientValidation: { required: true },
                      label: 'Country',
                      type: 'text',
                    },
                    {
                      accessor: 'shipping_postal_code',
                      clientValidation: {
                        maxLength: 20,
                        pattern: POSTAL_CODE_PATTERN,
                        required: true,
                      },
                      label: 'Postal Code',
                      type: 'text',
                    },
                  ],
                  type: 'row',
                },
              ],
              label: 'Address',
              type: 'group',
            },
            {
              fields: [
                {
                  fields: [
                    {
                      accessor: 'carrier',
                      clientValidation: { required: true },
                      label: 'Carrier',
                      options: toFieldOptions(CARRIER_VALUES),
                      type: 'radio',
                    },
                    {
                      accessor: 'warehouse_location',
                      clientValidation: { required: true },
                      label: 'Warehouse',
                      options: toFieldOptions(WAREHOUSE_LOCATION_VALUES),
                      type: 'radio',
                    },
                  ],
                  type: 'row',
                },
                {
                  fields: [
                    {
                      accessor: 'estimated_delivery_days',
                      clientValidation: { min: 0, required: true },
                      label: 'ETA (days)',
                      type: 'number',
                    },
                    {
                      accessor: 'tracking_number',
                      clientValidation: { maxLength: 100 },
                      label: 'Tracking Number',
                      type: 'text',
                    },
                  ],
                  type: 'row',
                },
                {
                  fields: [
                    {
                      accessor: 'shipped_date',
                      label: 'Shipped Date',
                      type: 'date',
                    },
                    {
                      accessor: 'delivery_date',
                      label: 'Delivery Date',
                      type: 'date',
                    },
                  ],
                  type: 'row',
                },
              ],
              label: 'Logistics',
              type: 'group',
            },
          ],
          label: 'Shipping',
        },
        {
          fields: [
            {
              fields: [
                {
                  accessor: 'billing_address_line1',
                  clientValidation: { maxLength: 200, required: true },
                  label: 'Address Line 1',
                  type: 'text',
                },
                {
                  fields: [
                    {
                      accessor: 'billing_city',
                      clientValidation: { required: true },
                      label: 'City',
                      type: 'text',
                    },
                    {
                      accessor: 'billing_state',
                      clientValidation: { required: true },
                      label: 'State',
                      type: 'text',
                    },
                  ],
                  type: 'row',
                },
                {
                  fields: [
                    {
                      accessor: 'billing_country',
                      clientValidation: { required: true },
                      label: 'Country',
                      type: 'text',
                    },
                    {
                      accessor: 'billing_postal_code',
                      clientValidation: {
                        maxLength: 20,
                        pattern: POSTAL_CODE_PATTERN,
                        required: true,
                      },
                      label: 'Postal Code',
                      type: 'text',
                    },
                  ],
                  type: 'row',
                },
              ],
              label: 'Billing Address',
              type: 'group',
            },
          ],
          label: 'Billing',
        },
        {
          fields: [
            {
              fields: [
                {
                  fields: [
                    {
                      accessor: 'payment_status',
                      clientValidation: { required: true },
                      label: 'Payment Status',
                      options: toFieldOptions(PAYMENT_STATUS_VALUES),
                      type: 'select',
                    },
                    {
                      accessor: 'payment_method',
                      clientValidation: { required: true },
                      label: 'Payment Method',
                      options: toFieldOptions(PAYMENT_METHOD_VALUES),
                      type: 'select',
                    },
                  ],
                  type: 'row',
                },
                {
                  fields: [
                    {
                      accessor: 'payment_date',
                      label: 'Payment Date',
                      type: 'date',
                    },
                    {
                      accessor: 'payment_reference',
                      clientValidation: { maxLength: 100 },
                      label: 'Payment Reference',
                      type: 'text',
                    },
                  ],
                  type: 'row',
                },
              ],
              label: 'Payment',
              type: 'group',
            },
          ],
          label: 'Payment',
        },
        {
          fields: [
            {
              fields: [
                {
                  accessor: 'order_notes',
                  label: 'Order Notes',
                  type: 'textarea',
                },
                {
                  accessor: 'internal_notes',
                  label: 'Internal Notes',
                  type: 'textarea',
                },
              ],
              label: 'Notes',
              type: 'group',
            },
            ...(isCreate
              ? []
              : ([
                  {
                    collapsible: true,
                    defaultCollapsed: true,
                    fields: [
                      {
                        fields: [
                          {
                            accessor: 'created_at',
                            disabled: true,
                            label: 'Created At',
                            type: 'text',
                          },
                          {
                            accessor: 'updated_at',
                            disabled: true,
                            label: 'Updated At',
                            type: 'text',
                          },
                        ],
                        type: 'row',
                      },
                      {
                        accessor: 'order_id',
                        disabled: true,
                        label: 'Order ID',
                        type: 'number',
                      },
                      {
                        accessor: 'last_modified_by',
                        disabled: true,
                        label: 'Last Modified By',
                        type: 'text',
                      },
                    ],
                    label: 'Audit',
                    type: 'group',
                  },
                ] as const)),
          ],
          label: 'Notes & Audit',
        },
      ],
      type: 'tab',
    },
  ];
};
