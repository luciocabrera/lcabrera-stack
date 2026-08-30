import { MAX_TABLE_GROUP_KEYS } from '#ui/components/Table/Table.constants';

import type { ColumnGroupingRefusal } from './ColumnOrderSection.types';

import { AGGREGATE_PICKER_GAP_MESSAGES } from '../GroupingSection/AddAggregateSection/AddAggregateSection.constants';

export const COLUMN_GROUPING_REFUSAL_MESSAGES: Record<
  ColumnGroupingRefusal,
  string
> = {
  ...AGGREGATE_PICKER_GAP_MESSAGES,
  'already-a-key': 'This column is already one of the grouping keys.',
  'key-cap-reached': `Grouping is limited to ${MAX_TABLE_GROUP_KEYS} keys, and this column has no aggregate left to add. Remove a group key to add it as one.`,
  'not-offered':
    'This column is offered neither as a group key nor as an aggregate, so a grouping cannot show it.',
};
