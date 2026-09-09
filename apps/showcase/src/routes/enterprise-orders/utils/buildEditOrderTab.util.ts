import { createFieldBuilders } from '@lcabrera/ui/components/Form';

import type { EnterpriseOrderValues } from '../config';

import { buildFlagsGroup } from './buildFlagsGroup.util';
import { buildOrderSummaryFields } from './buildOrderSummaryFields.util';

const { field, fieldGroup } = createFieldBuilders<EnterpriseOrderValues>();

export const buildEditOrderTab = () => ({
  fields: [
    fieldGroup({
      collapsible: false,
      fields: [
        field({
          accessor: 'order_number',
          disabled: true,
          label: 'Order Number',
          type: 'text',
        }),
        ...buildOrderSummaryFields(),
      ],
      label: 'Summary',
    }),
    buildFlagsGroup(),
  ],
  label: 'Order',
});
