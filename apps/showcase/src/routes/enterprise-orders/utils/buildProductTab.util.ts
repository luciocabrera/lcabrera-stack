import {
  createFieldBuilders,
  toFieldOptions,
} from '@lcabrera/ui/components/Form';

import type { EnterpriseOrderValues } from '../config';

import { PRODUCT_CATEGORY_VALUES } from '../config';

const { choiceField, field, fieldGroup, fieldRow } =
  createFieldBuilders<EnterpriseOrderValues>();

const PRODUCT_CATEGORY_OPTIONS = toFieldOptions(PRODUCT_CATEGORY_VALUES);

export const buildProductTab = () => ({
  fields: [
    fieldGroup({
      fields: [
        fieldRow({
          fields: [
            choiceField({
              accessor: 'product_category',
              label: 'Category',
              options: PRODUCT_CATEGORY_OPTIONS,
              required: true,
              type: 'select',
            }),
            field({
              accessor: 'product_subcategory',
              label: 'Subcategory',
              maxLength: 100,
              required: true,
              type: 'text',
            }),
          ],
        }),
        fieldRow({
          fields: [
            field({
              accessor: 'quantity',
              label: 'Quantity',
              min: 1,
              required: true,
              type: 'number',
            }),
            field({
              accessor: 'unit_price',
              label: 'Unit Price',
              min: 0,
              required: true,
              type: 'currency',
            }),
          ],
        }),
        fieldRow({
          fields: [
            field({
              accessor: 'weight_kg',
              label: 'Weight (kg)',
              min: 0,
              required: true,
              type: 'number',
            }),
            field({
              accessor: 'volume_m3',
              label: 'Volume (m³)',
              min: 0,
              required: true,
              type: 'number',
            }),
          ],
        }),
      ],
      label: 'Product',
    }),
  ],
  label: 'Product',
});
