import {
  createFieldBuilders,
  toFieldOptions,
} from '@lcabrera/ui/components/Form';

import type { EnterpriseOrderValues } from '../config';

import { CUSTOMER_TYPE_VALUES, EMAIL_PATTERN, PHONE_PATTERN } from '../config';

const { choiceField, field, fieldGroup, fieldRow, toggleField } =
  createFieldBuilders<EnterpriseOrderValues>();

const CUSTOMER_TYPE_OPTIONS = toFieldOptions(CUSTOMER_TYPE_VALUES);

export const buildCustomerTab = () => ({
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
});
