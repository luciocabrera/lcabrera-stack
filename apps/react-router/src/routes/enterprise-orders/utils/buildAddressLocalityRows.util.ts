import { createFieldBuilders } from '@lcabrera/ui/components/Form';

import type { EnterpriseOrderValues } from '../config';

import { POSTAL_CODE_PATTERN } from '../config';

const { field, fieldRow } = createFieldBuilders<EnterpriseOrderValues>();

/**
 * Build the shared `city`/`state` and `country`/`postal_code` rows of an address group,
 * parameterized by the column prefix.
 */
export const buildAddressLocalityRows = (prefix: 'billing' | 'shipping') => [
  fieldRow({
    fields: [
      field({
        accessor: `${prefix}_city`,
        label: 'City',
        required: true,
        type: 'text',
      }),
      field({
        accessor: `${prefix}_state`,
        label: 'State',
        required: true,
        type: 'text',
      }),
    ],
  }),
  fieldRow({
    fields: [
      field({
        accessor: `${prefix}_country`,
        label: 'Country',
        required: true,
        type: 'text',
      }),
      field({
        accessor: `${prefix}_postal_code`,
        label: 'Postal Code',
        maxLength: 20,
        pattern: POSTAL_CODE_PATTERN,
        required: true,
        type: 'text',
      }),
    ],
  }),
];
