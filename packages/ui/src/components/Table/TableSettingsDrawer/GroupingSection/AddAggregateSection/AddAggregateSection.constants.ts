import { MAX_TABLE_COUNT_DISTINCT_AGGREGATES } from '#ui/components/Table/Table.constants';

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
 * data, and would not explain why removing one is the way out.
 *
 * **The budget is interpolated, never spelled in prose.** It is a duplicate of
 * the server's constant and is expected to move — raising it needs only that
 * constant to change, with this side following through the contract test — and a
 * sentence reading "only one" would then be the single copy of the number that
 * nothing checks (AGENTS.md § "Never put a changing number in a comment or a
 * doc"). The phrasing is deliberately budget-agnostic for the same reason: "an
 * applied Distinct Count" stays true and grammatical at any value, where "the
 * other column" would not. It also avoids the words "already applied", which
 * belong to the message above it — the two causes are answered at different
 * controls, so their copy must not converge, and `AddAggregateSection.test.tsx`
 * asserts each against the other's absence on that wording.
 */
export const AGGREGATE_PICKER_GAP_MESSAGES: Record<AggregatePickerGap, string> =
  {
    'column-exhausted':
      'Every function this column supports is already applied. Remove one to add another.',
    'count-distinct-spent': `A grouped read carries at most ${MAX_TABLE_COUNT_DISTINCT_AGGREGATES} Distinct Count: it re-sorts every group, and again for each subtotal level, so another repeats the most expensive step of the query. Remove an applied Distinct Count to add it here.`,
  };
