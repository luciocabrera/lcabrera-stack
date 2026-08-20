import type {
  TableColumnAggregate,
  TableColumnGroupingCapability,
} from '#ui/components/Table/Table.types';

import { TABLE_AGGREGATE_LABELS } from '#ui/components/Table/Table.constants';
import { resolveOfferableAggregates } from '#ui/components/Table/utils/resolveOfferableAggregates.util';

type ResolveAddableAggregatesArgs = {
  /** Every aggregate staged in the drawer, across every column. */
  readonly applied: readonly TableColumnAggregate[];
  /** What the catalogue said about the chosen column (ADR-058). */
  readonly capability: TableColumnGroupingCapability | undefined;
  /** The chosen column; the empty string while none is chosen. */
  readonly columnKey: string;
  /** Whether that column is staged as a group key **in this drawer**. */
  readonly isGroupKey: boolean;
};

/**
 * The functions the drawer's "Add Aggregate" picker may still offer for the
 * chosen column, as select options — the offerable set minus what the column
 * already carries.
 *
 * **The subtraction lives here rather than in `resolveOfferableAggregates`, and
 * the asymmetry is deliberate** (#841). The shared predicate answers "may this
 * column be aggregated, and with what", which is a property of the column, and
 * both offering surfaces need that same answer. What they need on top of it
 * differs, because their gestures differ: this picker only ever *adds*, so an
 * applied function is a choice that cannot change anything —
 * `addTableColumnAggregate` guards the duplicate and returns the state it was
 * handed, leaving an Add that accepts a selection and does nothing visible. The
 * column header menu *toggles*, so it must go on offering an applied function:
 * that item is how it is removed, and subtracting it there would take the
 * toggle-off affordance away. Teaching the shared predicate about applied
 * aggregates would force one answer on both, so the picker composes instead.
 *
 * `isExhausted` separates the two ways the list can be empty, which the length
 * alone cannot: every legal function is already applied, versus none was legal
 * to begin with (an unaggregatable column, an active group key, or no column
 * chosen yet). Only the first has something to say — the column list still
 * offers such a column, by design (#830 owns that list and does not subtract),
 * so the picker has to explain why it went quiet rather than render an empty
 * control.
 */
export const resolveAddableAggregates = ({
  applied,
  capability,
  columnKey,
  isGroupKey,
}: ResolveAddableAggregatesArgs) => {
  const offered = resolveOfferableAggregates({ capability, isGroupKey });
  const appliedFns = new Set(
    applied
      .filter((aggregate) => aggregate.columnKey === columnKey)
      .map((aggregate) => aggregate.fn),
  );
  const options = offered
    .filter((fn) => !appliedFns.has(fn))
    .map((fn) => ({ label: TABLE_AGGREGATE_LABELS[fn], value: fn }));

  return {
    isExhausted: options.length === 0 && offered.length > 0,
    options,
  };
};
