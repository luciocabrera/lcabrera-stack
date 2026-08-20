import type { AggregatePickerGap } from '../GroupingSection.types';

/**
 * What the picker says in place of its function control, per cause — a `Record`
 * closed over the gap vocabulary, so a cause `resolveAddableAggregates` can
 * return with no entry here is a type error at the component that indexes it
 * rather than a blank control at runtime.
 *
 * The distinct-count message names a **cost**, not a prohibition, because that
 * is what `MAX_TABLE_COUNT_DISTINCT_AGGREGATES` is: `count(DISTINCT …)` sorts
 * every group, and does it again for each grouping set a rollup adds. A message
 * reading "not allowed" would teach the reader something false about their own
 * data, and would not explain why removing the one on another column is the way
 * out.
 */
export const AGGREGATE_PICKER_GAP_MESSAGES: Record<AggregatePickerGap, string> =
  {
    'column-exhausted':
      'Every function this column supports is already applied. Remove one to add another.',
    'count-distinct-spent':
      'Only one Distinct Count fits in a grouped read: it re-sorts every group, and again for each subtotal level, so a second one repeats the most expensive step of the query. Remove the Distinct Count on the other column to add it here.',
  };
