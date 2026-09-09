import { createFieldBuilders } from '@lcabrera/ui/components/Form';

import type { EnterpriseOrderValues } from '../config';

const { field, fieldGroup } = createFieldBuilders<EnterpriseOrderValues>();

export const buildNotesGroup = () =>
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
  });
