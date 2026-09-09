import { createFieldBuilders } from '@lcabrera/ui/components/Form';

import type { EnterpriseOrderValues } from '../config';

const { fieldGroup, fieldRow, toggleField } =
  createFieldBuilders<EnterpriseOrderValues>();

export const buildFlagsGroup = () =>
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
  });
