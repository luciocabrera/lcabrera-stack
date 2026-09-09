import {
  createFieldBuilders,
  toFieldOptions,
} from '@lcabrera/ui/components/Form';

import type { EnterpriseOrderValues } from '../config';

import { ORDER_STATUS_VALUES, PRIORITY_VALUES } from '../config';

const { choiceField, field } = createFieldBuilders<EnterpriseOrderValues>();

const ORDER_STATUS_OPTIONS = toFieldOptions(ORDER_STATUS_VALUES);
const PRIORITY_OPTIONS = toFieldOptions(PRIORITY_VALUES);

export const buildOrderSummaryFields = () => [
  field({
    accessor: 'order_date',
    label: 'Order Date',
    required: true,
    type: 'date',
  }),
  choiceField({
    accessor: 'order_status',
    label: 'Status',
    options: ORDER_STATUS_OPTIONS,
    required: true,
    type: 'select',
  }),
  choiceField({
    accessor: 'priority',
    label: 'Priority',
    options: PRIORITY_OPTIONS,
    required: true,
    type: 'radio',
  }),
];
