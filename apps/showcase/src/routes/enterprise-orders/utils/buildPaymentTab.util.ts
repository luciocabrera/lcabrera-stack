import {
  createFieldBuilders,
  toFieldOptions,
} from '@lcabrera/ui/components/Form';

import type { EnterpriseOrderValues } from '../config';

import { PAYMENT_METHOD_VALUES, PAYMENT_STATUS_VALUES } from '../config';

const { choiceField, field, fieldGroup, fieldRow } =
  createFieldBuilders<EnterpriseOrderValues>();

const PAYMENT_METHOD_OPTIONS = toFieldOptions(PAYMENT_METHOD_VALUES);
const PAYMENT_STATUS_OPTIONS = toFieldOptions(PAYMENT_STATUS_VALUES);

export const buildPaymentTab = () => ({
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
});
