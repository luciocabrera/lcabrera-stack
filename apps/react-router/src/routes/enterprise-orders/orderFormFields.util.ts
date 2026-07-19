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
import { orderChoiceField } from './orderChoiceField.util';
import { orderField } from './orderField.util';
import { orderGroup } from './orderGroup.util';
import { orderRow } from './orderRow.util';
import { orderToggle } from './orderToggle.util';

// Precomputed select/radio option sets — hoisted so the field factories stay
// shallow (avoids nesting `toFieldOptions` inside group→row→field calls).
const CARRIER_OPTIONS = toFieldOptions(CARRIER_VALUES);
const CUSTOMER_TYPE_OPTIONS = toFieldOptions(CUSTOMER_TYPE_VALUES);
const ORDER_STATUS_OPTIONS = toFieldOptions(ORDER_STATUS_VALUES);
const PAYMENT_METHOD_OPTIONS = toFieldOptions(PAYMENT_METHOD_VALUES);
const PAYMENT_STATUS_OPTIONS = toFieldOptions(PAYMENT_STATUS_VALUES);
const PRIORITY_OPTIONS = toFieldOptions(PRIORITY_VALUES);
const PRODUCT_CATEGORY_OPTIONS = toFieldOptions(PRODUCT_CATEGORY_VALUES);
const WAREHOUSE_OPTIONS = toFieldOptions(WAREHOUSE_LOCATION_VALUES);

export type BuildOrderFormFieldsArgs = {
  readonly mode: FormMode;
};

/**
 * Build the enterprise-order Form field tree (tabs → card groups → rows) for a
 * given mode (feature plan §4). Small enum fields render as radio-cards, large
 * sets as selects, and money fields as currency. Server-assigned identity,
 * computed money totals and audit columns are read-only and only appear in
 * edit/view (create derives them on save); `view` mode renders every field
 * read-only via the Form itself. The tree is assembled from small typed
 * factories (`orderField`/`orderChoiceField`/`orderToggle`/`orderRow`/
 * `orderGroup`) so the repeated field scaffolding lives in one place.
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
            orderGroup({
              collapsible: false,
              fields: [
                ...(isCreate
                  ? []
                  : [
                      orderField({
                        accessor: 'order_number',
                        disabled: true,
                        label: 'Order Number',
                        type: 'text',
                      }),
                    ]),
                orderField({
                  accessor: 'order_date',
                  label: 'Order Date',
                  required: true,
                  type: 'date',
                }),
                orderChoiceField({
                  accessor: 'order_status',
                  label: 'Status',
                  options: ORDER_STATUS_OPTIONS,
                  required: true,
                  type: 'select',
                }),
                orderChoiceField({
                  accessor: 'priority',
                  label: 'Priority',
                  options: PRIORITY_OPTIONS,
                  required: true,
                  type: 'radio',
                }),
              ],
              label: 'Summary',
            }),
            orderGroup({
              fields: [
                orderRow({
                  fields: [
                    orderToggle({
                      accessor: 'is_rush_order',
                      label: 'Rush order',
                    }),
                    orderToggle({ accessor: 'is_gift', label: 'Gift' }),
                    orderToggle({ accessor: 'is_fragile', label: 'Fragile' }),
                    orderToggle({
                      accessor: 'requires_signature',
                      label: 'Requires signature',
                    }),
                  ],
                }),
              ],
              label: 'Flags',
            }),
          ],
          label: 'Order',
        },
        {
          fields: [
            orderGroup({
              fields: [
                orderRow({
                  fields: [
                    orderField({
                      accessor: 'customer_name',
                      label: 'Customer Name',
                      maxLength: 200,
                      required: true,
                      type: 'text',
                    }),
                    orderField({
                      accessor: 'customer_email',
                      label: 'Email',
                      pattern: EMAIL_PATTERN,
                      required: true,
                      type: 'email',
                    }),
                  ],
                }),
                orderRow({
                  fields: [
                    orderField({
                      accessor: 'customer_phone',
                      label: 'Phone',
                      pattern: PHONE_PATTERN,
                      required: true,
                      type: 'text',
                    }),
                    orderChoiceField({
                      accessor: 'customer_type',
                      label: 'Customer Type',
                      options: CUSTOMER_TYPE_OPTIONS,
                      required: true,
                      type: 'radio',
                    }),
                  ],
                }),
                orderField({
                  accessor: 'customer_id',
                  label: 'Customer ID',
                  min: 1,
                  required: true,
                  type: 'number',
                }),
              ],
              label: 'Identity',
            }),
            orderGroup({
              fields: [
                orderRow({
                  fields: [
                    orderToggle({
                      accessor: 'is_vip_customer',
                      label: 'VIP customer',
                    }),
                    orderField({
                      accessor: 'loyalty_points',
                      label: 'Loyalty Points',
                      min: 0,
                      required: true,
                      type: 'number',
                    }),
                  ],
                }),
                orderRow({
                  fields: [
                    orderField({
                      accessor: 'customer_since',
                      label: 'Customer Since',
                      required: true,
                      type: 'date',
                    }),
                    orderField({
                      accessor: 'customer_rating',
                      description: 'Optional, 1–5.',
                      label: 'Rating',
                      max: 5,
                      min: 1,
                      type: 'number',
                    }),
                  ],
                }),
              ],
              label: 'Loyalty',
            }),
          ],
          label: 'Customer',
        },
        {
          fields: [
            orderGroup({
              fields: [
                orderRow({
                  fields: [
                    orderChoiceField({
                      accessor: 'product_category',
                      label: 'Category',
                      options: PRODUCT_CATEGORY_OPTIONS,
                      required: true,
                      type: 'select',
                    }),
                    orderField({
                      accessor: 'product_subcategory',
                      label: 'Subcategory',
                      maxLength: 100,
                      required: true,
                      type: 'text',
                    }),
                  ],
                }),
                orderRow({
                  fields: [
                    orderField({
                      accessor: 'quantity',
                      label: 'Quantity',
                      min: 1,
                      required: true,
                      type: 'number',
                    }),
                    orderField({
                      accessor: 'unit_price',
                      label: 'Unit Price',
                      min: 0,
                      required: true,
                      type: 'currency',
                    }),
                  ],
                }),
                orderRow({
                  fields: [
                    orderField({
                      accessor: 'weight_kg',
                      label: 'Weight (kg)',
                      min: 0,
                      required: true,
                      type: 'number',
                    }),
                    orderField({
                      accessor: 'volume_m3',
                      label: 'Volume (m³)',
                      min: 0,
                      required: true,
                      type: 'number',
                    }),
                  ],
                }),
              ],
              label: 'Product',
            }),
          ],
          label: 'Product',
        },
        {
          fields: [
            orderGroup({
              fields: [
                orderRow({
                  fields: [
                    orderField({
                      accessor: 'discount_percentage',
                      label: 'Discount %',
                      max: 100,
                      min: 0,
                      required: true,
                      type: 'number',
                    }),
                    orderField({
                      accessor: 'shipping_cost',
                      label: 'Shipping Cost',
                      min: 0,
                      required: true,
                      type: 'currency',
                    }),
                    orderField({
                      accessor: 'paid_amount',
                      label: 'Paid Amount',
                      min: 0,
                      required: true,
                      type: 'currency',
                    }),
                  ],
                  spans: [1, 1, 1],
                }),
              ],
              label: 'Pricing Inputs',
            }),
            ...(isCreate
              ? []
              : [
                  orderGroup({
                    fields: [
                      orderRow({
                        fields: [
                          orderField({
                            accessor: 'subtotal',
                            disabled: true,
                            label: 'Subtotal',
                            type: 'currency',
                          }),
                          orderField({
                            accessor: 'discount_amount',
                            disabled: true,
                            label: 'Discount',
                            type: 'currency',
                          }),
                        ],
                      }),
                      orderRow({
                        fields: [
                          orderField({
                            accessor: 'tax_amount',
                            disabled: true,
                            label: 'Tax',
                            type: 'currency',
                          }),
                          orderField({
                            accessor: 'total_amount',
                            disabled: true,
                            label: 'Total',
                            type: 'currency',
                          }),
                        ],
                      }),
                      orderField({
                        accessor: 'balance_due',
                        disabled: true,
                        label: 'Balance Due',
                        type: 'currency',
                      }),
                    ],
                    label: 'Computed Totals',
                  }),
                ]),
          ],
          label: 'Pricing',
        },
        {
          fields: [
            orderGroup({
              fields: [
                orderRow({
                  fields: [
                    orderField({
                      accessor: 'shipping_address_line1',
                      label: 'Address Line 1',
                      maxLength: 200,
                      required: true,
                      type: 'text',
                    }),
                    orderField({
                      accessor: 'shipping_address_line2',
                      label: 'Address Line 2',
                      maxLength: 200,
                      type: 'text',
                    }),
                  ],
                  spans: [2, 1],
                }),
                orderRow({
                  fields: [
                    orderField({
                      accessor: 'shipping_city',
                      label: 'City',
                      required: true,
                      type: 'text',
                    }),
                    orderField({
                      accessor: 'shipping_state',
                      label: 'State',
                      required: true,
                      type: 'text',
                    }),
                  ],
                }),
                orderRow({
                  fields: [
                    orderField({
                      accessor: 'shipping_country',
                      label: 'Country',
                      required: true,
                      type: 'text',
                    }),
                    orderField({
                      accessor: 'shipping_postal_code',
                      label: 'Postal Code',
                      maxLength: 20,
                      pattern: POSTAL_CODE_PATTERN,
                      required: true,
                      type: 'text',
                    }),
                  ],
                }),
              ],
              label: 'Address',
            }),
            orderGroup({
              fields: [
                orderRow({
                  fields: [
                    orderChoiceField({
                      accessor: 'carrier',
                      label: 'Carrier',
                      options: CARRIER_OPTIONS,
                      required: true,
                      type: 'radio',
                    }),
                    orderChoiceField({
                      accessor: 'warehouse_location',
                      label: 'Warehouse',
                      options: WAREHOUSE_OPTIONS,
                      required: true,
                      type: 'radio',
                    }),
                  ],
                }),
                orderRow({
                  fields: [
                    orderField({
                      accessor: 'estimated_delivery_days',
                      label: 'ETA (days)',
                      min: 0,
                      required: true,
                      type: 'number',
                    }),
                    orderField({
                      accessor: 'tracking_number',
                      label: 'Tracking Number',
                      maxLength: 100,
                      type: 'text',
                    }),
                  ],
                }),
                orderRow({
                  fields: [
                    orderField({
                      accessor: 'shipped_date',
                      label: 'Shipped Date',
                      type: 'date',
                    }),
                    orderField({
                      accessor: 'delivery_date',
                      label: 'Delivery Date',
                      type: 'date',
                    }),
                  ],
                }),
              ],
              label: 'Logistics',
            }),
          ],
          label: 'Shipping',
        },
        {
          fields: [
            orderGroup({
              fields: [
                orderField({
                  accessor: 'billing_address_line1',
                  label: 'Address Line 1',
                  maxLength: 200,
                  required: true,
                  type: 'text',
                }),
                orderRow({
                  fields: [
                    orderField({
                      accessor: 'billing_city',
                      label: 'City',
                      required: true,
                      type: 'text',
                    }),
                    orderField({
                      accessor: 'billing_state',
                      label: 'State',
                      required: true,
                      type: 'text',
                    }),
                  ],
                }),
                orderRow({
                  fields: [
                    orderField({
                      accessor: 'billing_country',
                      label: 'Country',
                      required: true,
                      type: 'text',
                    }),
                    orderField({
                      accessor: 'billing_postal_code',
                      label: 'Postal Code',
                      maxLength: 20,
                      pattern: POSTAL_CODE_PATTERN,
                      required: true,
                      type: 'text',
                    }),
                  ],
                }),
              ],
              label: 'Billing Address',
            }),
          ],
          label: 'Billing',
        },
        {
          fields: [
            orderGroup({
              fields: [
                orderRow({
                  fields: [
                    orderChoiceField({
                      accessor: 'payment_status',
                      label: 'Payment Status',
                      options: PAYMENT_STATUS_OPTIONS,
                      required: true,
                      type: 'select',
                    }),
                    orderChoiceField({
                      accessor: 'payment_method',
                      label: 'Payment Method',
                      options: PAYMENT_METHOD_OPTIONS,
                      required: true,
                      type: 'select',
                    }),
                  ],
                }),
                orderRow({
                  fields: [
                    orderField({
                      accessor: 'payment_date',
                      label: 'Payment Date',
                      type: 'date',
                    }),
                    orderField({
                      accessor: 'payment_reference',
                      label: 'Payment Reference',
                      maxLength: 100,
                      type: 'text',
                    }),
                  ],
                }),
              ],
              label: 'Payment',
            }),
          ],
          label: 'Payment',
        },
        {
          fields: [
            orderGroup({
              fields: [
                orderField({
                  accessor: 'order_notes',
                  label: 'Order Notes',
                  type: 'textarea',
                }),
                orderField({
                  accessor: 'internal_notes',
                  label: 'Internal Notes',
                  type: 'textarea',
                }),
              ],
              label: 'Notes',
            }),
            ...(isCreate
              ? []
              : [
                  orderGroup({
                    collapsible: true,
                    defaultCollapsed: true,
                    fields: [
                      orderRow({
                        fields: [
                          orderField({
                            accessor: 'created_at',
                            disabled: true,
                            label: 'Created At',
                            type: 'text',
                          }),
                          orderField({
                            accessor: 'updated_at',
                            disabled: true,
                            label: 'Updated At',
                            type: 'text',
                          }),
                        ],
                      }),
                      orderField({
                        accessor: 'order_id',
                        disabled: true,
                        label: 'Order ID',
                        type: 'number',
                      }),
                      orderField({
                        accessor: 'last_modified_by',
                        disabled: true,
                        label: 'Last Modified By',
                        type: 'text',
                      }),
                    ],
                    label: 'Audit',
                  }),
                ]),
          ],
          label: 'Notes & Audit',
        },
      ],
      type: 'tab',
    },
  ];
};
