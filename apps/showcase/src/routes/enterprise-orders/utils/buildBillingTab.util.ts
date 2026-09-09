import { createFieldBuilders } from '@lcabrera/ui/components/Form';

import type { EnterpriseOrderValues } from '../config';

import { buildAddressLocalityRows } from './buildAddressLocalityRows.util';

const { field, fieldGroup } = createFieldBuilders<EnterpriseOrderValues>();

export const buildBillingTab = () => ({
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
});
