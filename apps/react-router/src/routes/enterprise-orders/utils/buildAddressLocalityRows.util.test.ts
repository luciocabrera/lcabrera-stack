import { describe, expect, it } from 'vite-plus/test';

import { POSTAL_CODE_PATTERN } from '../config';
import { buildAddressLocalityRows } from './buildAddressLocalityRows.util';

describe('buildAddressLocalityRows', () => {
  it('builds the city/state and country/postal rows for a prefix', () => {
    expect(buildAddressLocalityRows('shipping')).toStrictEqual([
      {
        fields: [
          {
            accessor: 'shipping_city',
            clientValidation: { required: true },
            label: 'City',
            type: 'text',
          },
          {
            accessor: 'shipping_state',
            clientValidation: { required: true },
            label: 'State',
            type: 'text',
          },
        ],
        type: 'row',
      },
      {
        fields: [
          {
            accessor: 'shipping_country',
            clientValidation: { required: true },
            label: 'Country',
            type: 'text',
          },
          {
            accessor: 'shipping_postal_code',
            clientValidation: {
              maxLength: 20,
              pattern: POSTAL_CODE_PATTERN,
              required: true,
            },
            label: 'Postal Code',
            type: 'text',
          },
        ],
        type: 'row',
      },
    ]);
  });

  it('applies the billing prefix to every accessor', () => {
    const accessors = buildAddressLocalityRows('billing')
      .flatMap((row) => row.fields)
      .map((field) => ('accessor' in field ? field.accessor : undefined));

    expect(accessors).toStrictEqual([
      'billing_city',
      'billing_state',
      'billing_country',
      'billing_postal_code',
    ]);
  });
});
