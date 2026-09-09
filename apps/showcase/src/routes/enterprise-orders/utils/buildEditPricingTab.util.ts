import { createFieldBuilders } from '@lcabrera/ui/components/Form';

import type { EnterpriseOrderValues } from '../config';

import { buildPricingInputsGroup } from './buildPricingInputsGroup.util';

const { field, fieldGroup, fieldRow } =
  createFieldBuilders<EnterpriseOrderValues>();

export const buildEditPricingTab = () => ({
  fields: [
    buildPricingInputsGroup(),
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
  ],
  label: 'Pricing',
});
