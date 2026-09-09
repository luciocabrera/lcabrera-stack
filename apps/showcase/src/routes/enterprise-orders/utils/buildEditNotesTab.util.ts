import { createFieldBuilders } from '@lcabrera/ui/components/Form';

import type { EnterpriseOrderValues } from '../config';

import { buildNotesGroup } from './buildNotesGroup.util';

const { field, fieldGroup, fieldRow } =
  createFieldBuilders<EnterpriseOrderValues>();

export const buildEditNotesTab = () => ({
  fields: [
    buildNotesGroup(),
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
  ],
  label: 'Notes & Audit',
});
