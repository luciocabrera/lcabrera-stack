import type { FieldNode } from '@lcabrera/ui/components/Form';
import type { FormMode } from '@lcabrera/ui/components/Form/Form.types';

import {
  createFieldBuilders,
  toFieldOptions,
} from '@lcabrera/ui/components/Form';

import type { EnterpriseOrderValues } from '../config';

import {
  CARRIER_VALUES,
  CUSTOMER_TYPE_VALUES,
  EMAIL_PATTERN,
  ORDER_STATUS_VALUES,
  PAYMENT_METHOD_VALUES,
  PAYMENT_STATUS_VALUES,
  PHONE_PATTERN,
  PRIORITY_VALUES,
  PRODUCT_CATEGORY_VALUES,
  WAREHOUSE_LOCATION_VALUES,
} from '../config';
import { buildAddressLocalityRows } from './buildAddressLocalityRows.util';

const { choiceField, field, fieldGroup, fieldRow, toggleField } =
  createFieldBuilders<EnterpriseOrderValues>();

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
 * read-only via the Form itself. The tree is assembled from the shared
 * `@lcabrera/ui` Form builders (`field`/`choiceField`/`toggleField`/`fieldRow`/
 * `fieldGroup`), bound to `EnterpriseOrderValues` via `createFieldBuilders`, so
 * the repeated field scaffolding lives in one place.
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
            fieldGroup({
              collapsible: false,
              fields: [
                ...(isCreate
                  ? []
                  : [
                      field({
                        accessor: 'order_number',
                        disabled: true,
                        label: 'Order Number',
                        type: 'text',
                      }),
                    ]),
                field({
                  accessor: 'order_date',
                  label: 'Order Date',
                  required: true,
                  type: 'date',
                }),
                choiceField({
                  accessor: 'order_status',
                  label: 'Status',
                  options: ORDER_STATUS_OPTIONS,
                  required: true,
                  type: 'select',
                }),
                choiceField({
                  accessor: 'priority',
                  label: 'Priority',
                  options: PRIORITY_OPTIONS,
                  required: true,
                  type: 'radio',
                }),
              ],
              label: 'Summary',
            }),
            fieldGroup({
              fields: [
                fieldRow({
                  fields: [
                    toggleField({
                      accessor: 'is_rush_order',
                      label: 'Rush order',
                    }),
                    toggleField({ accessor: 'is_gift', label: 'Gift' }),
                    toggleField({ accessor: 'is_fragile', label: 'Fragile' }),
                    toggleField({
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
            fieldGroup({
              fields: [
                fieldRow({
                  fields: [
                    field({
                      accessor: 'customer_name',
                      label: 'Customer Name',
                      maxLength: 200,
                      required: true,
                      type: 'text',
                    }),
                    field({
                      accessor: 'customer_email',
                      label: 'Email',
                      pattern: EMAIL_PATTERN,
                      required: true,
                      type: 'email',
                    }),
                  ],
                }),
                fieldRow({
                  fields: [
                    field({
                      accessor: 'customer_phone',
                      label: 'Phone',
                      pattern: PHONE_PATTERN,
                      required: true,
                      type: 'text',
                    }),
                    choiceField({
                      accessor: 'customer_type',
                      label: 'Customer Type',
                      options: CUSTOMER_TYPE_OPTIONS,
                      required: true,
                      type: 'radio',
                    }),
                  ],
                }),
                field({
                  accessor: 'customer_id',
                  label: 'Customer ID',
                  min: 1,
                  required: true,
                  type: 'number',
                }),
              ],
              label: 'Identity',
            }),
            fieldGroup({
              fields: [
                fieldRow({
                  fields: [
                    toggleField({
                      accessor: 'is_vip_customer',
                      label: 'VIP customer',
                    }),
                    field({
                      accessor: 'loyalty_points',
                      label: 'Loyalty Points',
                      min: 0,
                      required: true,
                      type: 'number',
                    }),
                  ],
                }),
                fieldRow({
                  fields: [
                    field({
                      accessor: 'customer_since',
                      label: 'Customer Since',
                      required: true,
                      type: 'date',
                    }),
                    field({
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
            fieldGroup({
              fields: [
                fieldRow({
                  fields: [
                    choiceField({
                      accessor: 'product_category',
                      label: 'Category',
                      options: PRODUCT_CATEGORY_OPTIONS,
                      required: true,
                      type: 'select',
                    }),
                    field({
                      accessor: 'product_subcategory',
                      label: 'Subcategory',
                      maxLength: 100,
                      required: true,
                      type: 'text',
                    }),
                  ],
                }),
                fieldRow({
                  fields: [
                    field({
                      accessor: 'quantity',
                      label: 'Quantity',
                      min: 1,
                      required: true,
                      type: 'number',
                    }),
                    field({
                      accessor: 'unit_price',
                      label: 'Unit Price',
                      min: 0,
                      required: true,
                      type: 'currency',
                    }),
                  ],
                }),
                fieldRow({
                  fields: [
                    field({
                      accessor: 'weight_kg',
                      label: 'Weight (kg)',
                      min: 0,
                      required: true,
                      type: 'number',
                    }),
                    field({
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
            fieldGroup({
              fields: [
                fieldRow({
                  fields: [
                    field({
                      accessor: 'discount_percentage',
                      label: 'Discount %',
                      max: 100,
                      min: 0,
                      required: true,
                      type: 'number',
                    }),
                    field({
                      accessor: 'shipping_cost',
                      label: 'Shipping Cost',
                      min: 0,
                      required: true,
                      type: 'currency',
                    }),
                    field({
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
                  fieldGroup({
                    fields: [
                      fieldRow({
                        fields: [
                          field({
                            accessor: 'subtotal',
                            disabled: true,
                            label: 'Subtotal',
                            type: 'currency',
                          }),
                          field({
                            accessor: 'discount_amount',
                            disabled: true,
                            label: 'Discount',
                            type: 'currency',
                          }),
                        ],
                      }),
                      fieldRow({
                        fields: [
                          field({
                            accessor: 'tax_amount',
                            disabled: true,
                            label: 'Tax',
                            type: 'currency',
                          }),
                          field({
                            accessor: 'total_amount',
                            disabled: true,
                            label: 'Total',
                            type: 'currency',
                          }),
                        ],
                      }),
                      field({
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
            fieldGroup({
              fields: [
                fieldRow({
                  fields: [
                    field({
                      accessor: 'shipping_address_line1',
                      label: 'Address Line 1',
                      maxLength: 200,
                      required: true,
                      type: 'text',
                    }),
                    field({
                      accessor: 'shipping_address_line2',
                      label: 'Address Line 2',
                      maxLength: 200,
                      type: 'text',
                    }),
                  ],
                  spans: [2, 1],
                }),
                ...buildAddressLocalityRows('shipping'),
              ],
              label: 'Address',
            }),
            fieldGroup({
              fields: [
                fieldRow({
                  fields: [
                    choiceField({
                      accessor: 'carrier',
                      label: 'Carrier',
                      options: CARRIER_OPTIONS,
                      required: true,
                      type: 'radio',
                    }),
                    choiceField({
                      accessor: 'warehouse_location',
                      label: 'Warehouse',
                      options: WAREHOUSE_OPTIONS,
                      required: true,
                      type: 'radio',
                    }),
                  ],
                }),
                fieldRow({
                  fields: [
                    field({
                      accessor: 'estimated_delivery_days',
                      label: 'ETA (days)',
                      min: 0,
                      required: true,
                      type: 'number',
                    }),
                    field({
                      accessor: 'tracking_number',
                      label: 'Tracking Number',
                      maxLength: 100,
                      type: 'text',
                    }),
                  ],
                }),
                fieldRow({
                  fields: [
                    field({
                      accessor: 'shipped_date',
                      label: 'Shipped Date',
                      type: 'date',
                    }),
                    field({
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
            fieldGroup({
              fields: [
                field({
                  accessor: 'billing_address_line1',
                  label: 'Address Line 1',
                  maxLength: 200,
                  required: true,
                  type: 'text',
                }),
                ...buildAddressLocalityRows('billing'),
              ],
              label: 'Billing Address',
            }),
          ],
          label: 'Billing',
        },
        {
          fields: [
            fieldGroup({
              fields: [
                fieldRow({
                  fields: [
                    choiceField({
                      accessor: 'payment_status',
                      label: 'Payment Status',
                      options: PAYMENT_STATUS_OPTIONS,
                      required: true,
                      type: 'select',
                    }),
                    choiceField({
                      accessor: 'payment_method',
                      label: 'Payment Method',
                      options: PAYMENT_METHOD_OPTIONS,
                      required: true,
                      type: 'select',
                    }),
                  ],
                }),
                fieldRow({
                  fields: [
                    field({
                      accessor: 'payment_date',
                      label: 'Payment Date',
                      type: 'date',
                    }),
                    field({
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
            fieldGroup({
              fields: [
                field({
                  accessor: 'order_notes',
                  label: 'Order Notes',
                  type: 'textarea',
                }),
                field({
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
                  fieldGroup({
                    collapsible: true,
                    defaultCollapsed: true,
                    fields: [
                      fieldRow({
                        fields: [
                          field({
                            accessor: 'created_at',
                            disabled: true,
                            label: 'Created At',
                            type: 'text',
                          }),
                          field({
                            accessor: 'updated_at',
                            disabled: true,
                            label: 'Updated At',
                            type: 'text',
                          }),
                        ],
                      }),
                      field({
                        accessor: 'order_id',
                        disabled: true,
                        label: 'Order ID',
                        type: 'number',
                      }),
                      field({
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
