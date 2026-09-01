import { MAX_TABLE_COUNT_DISTINCT_AGGREGATES } from '#ui/components/Table/Table.constants';

import type { AggregatePickerGap } from '../GroupingSection.types';

export const AGGREGATE_PICKER_GAP_MESSAGES: Record<AggregatePickerGap, string> =
  {
    'column-exhausted':
      'Every function this column supports is already applied. Remove one to add another.',
    'count-distinct-spent': `A grouped read carries at most ${MAX_TABLE_COUNT_DISTINCT_AGGREGATES} Distinct Count: it re-sorts every group, and again for each subtotal level, so another repeats the most expensive step of the query. Remove an applied Distinct Count to add it here.`,
  };
