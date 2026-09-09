import {
  createFieldBuilders,
  toFieldOptions,
} from '@lcabrera/ui/components/Form';

import type { EnterpriseOrderValues } from '../config';

import { CARRIER_VALUES, WAREHOUSE_LOCATION_VALUES } from '../config';
import { buildAddressLocalityRows } from './buildAddressLocalityRows.util';

const { choiceField, field, fieldGroup, fieldRow } =
  createFieldBuilders<EnterpriseOrderValues>();

const CARRIER_OPTIONS = toFieldOptions(CARRIER_VALUES);
const WAREHOUSE_OPTIONS = toFieldOptions(WAREHOUSE_LOCATION_VALUES);

export const buildShippingTab = () => ({
  fields: [
    fieldGroup({
      fields: [
        fieldRow({
          fields: [
            field({
              accessor: 'shipping_address_line1',
              label: 'Address Line 1',
              maxLength: 200,
              required: true,
              type: 'text',
            }),
            field({
              accessor: 'shipping_address_line2',
              label: 'Address Line 2',
              maxLength: 200,
              type: 'text',
            }),
          ],
          spans: [2, 1],
        }),
        ...buildAddressLocalityRows('shipping'),
      ],
      label: 'Address',
    }),
    fieldGroup({
      fields: [
        fieldRow({
          fields: [
            choiceField({
              accessor: 'carrier',
              label: 'Carrier',
              options: CARRIER_OPTIONS,
              required: true,
              type: 'radio',
            }),
            choiceField({
              accessor: 'warehouse_location',
              label: 'Warehouse',
              options: WAREHOUSE_OPTIONS,
              required: true,
              type: 'radio',
            }),
          ],
        }),
        fieldRow({
          fields: [
            field({
              accessor: 'estimated_delivery_days',
              label: 'ETA (days)',
              min: 0,
              required: true,
              type: 'number',
            }),
            field({
              accessor: 'tracking_number',
              label: 'Tracking Number',
              maxLength: 100,
              type: 'text',
            }),
          ],
        }),
        fieldRow({
          fields: [
            field({
              accessor: 'shipped_date',
              label: 'Shipped Date',
              type: 'date',
            }),
            field({
              accessor: 'delivery_date',
              label: 'Delivery Date',
              type: 'date',
            }),
          ],
        }),
      ],
      label: 'Logistics',
    }),
  ],
  label: 'Shipping',
});
