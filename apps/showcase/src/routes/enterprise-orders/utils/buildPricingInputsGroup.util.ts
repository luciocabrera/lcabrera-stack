import { createFieldBuilders } from '@lcabrera/ui/components/Form';

import type { EnterpriseOrderValues } from '../config';

const { field, fieldGroup, fieldRow } =
  createFieldBuilders<EnterpriseOrderValues>();

export const buildPricingInputsGroup = () =>
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
  });
