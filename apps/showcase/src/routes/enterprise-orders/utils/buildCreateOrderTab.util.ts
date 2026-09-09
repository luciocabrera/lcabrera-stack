import { createFieldBuilders } from '@lcabrera/ui/components/Form';

import type { EnterpriseOrderValues } from '../config';

import { buildFlagsGroup } from './buildFlagsGroup.util';
import { buildOrderSummaryFields } from './buildOrderSummaryFields.util';

const { fieldGroup } = createFieldBuilders<EnterpriseOrderValues>();

export const buildCreateOrderTab = () => ({
  fields: [
    fieldGroup({
      collapsible: false,
      fields: buildOrderSummaryFields(),
      label: 'Summary',
    }),
    buildFlagsGroup(),
  ],
  label: 'Order',
});
