import { createFieldBuilders } from '@lcabrera/ui/components/Form';

import type { EnterpriseOrderValues } from '../config';

import { POSTAL_CODE_PATTERN } from '../config';

const { field, fieldRow } = createFieldBuilders<EnterpriseOrderValues>();

/**
 * Build the shared `city`/`state` and `country`/`postal_code` rows of an address
 * group, parameterized by the column prefix. The shipping and billing address
 * sections are identical below their first line, so this keeps that scaffolding
 * in one place; the leading `address_line1`/`address_line2` differ per section
 * (shipping pairs the two lines in a spans row; billing has line 1 only) and
 * stay inline at each call site.
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
