import type {
  TableAggregateFn,
  TableColumnAggregate,
  TableColumnGroupingCapability,
} from '#ui/components/Table/Table.types';

import { TABLE_AGGREGATE_LABELS } from '#ui/components/Table/Table.constants';
import { resolveAffordableAggregates } from '#ui/components/Table/utils/resolveAffordableAggregates.util';

import type { AggregatePickerGap } from '../GroupingSection.types';

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

type ResolveGapArgs = {
  readonly affordable: readonly TableAggregateFn[];
  readonly appliedFns: ReadonlySet<TableAggregateFn>;
  readonly hasOptions: boolean;
  readonly withheld: readonly TableAggregateFn[];
};

/**
 * Why the picker has nothing to offer, or `undefined` while it has something —
 * the cause, never the fact, because an empty list is what every cause has in
 * common.
 *
 * Ordered by what the user can act on. A function withheld for the read's
 * `countDistinct` budget is a fact about the *rest* of the configuration, so it
 * outranks exhaustion: a column offered `count` and `countDistinct` that carries
 * `count` while another column carries the distinct count is not "fully
 * measured", and telling the user to remove one of this column's measures would
 * send them to the wrong control (#842). Exhaustion comes next (#841), and the
 * remaining empties — no column chosen, an unaggregatable column, a staged group
 * key — have nothing to say and answer `undefined`.
 *
 * Annotated, unlike almost everything here, because inference widens a returned
 * string literal to `string`: the annotation is what checks these tokens against
 * the vocabulary the message map is closed over, at the point they are written
 * rather than at the component that indexes with them.
 */
const resolveGap = ({
  affordable,
  appliedFns,
  hasOptions,
  withheld,
}: ResolveGapArgs): AggregatePickerGap | undefined => {
  if (hasOptions) return;
  // Only a withheld function this column could otherwise have *added*: one it
  // already carries is not a gap, it is an entry in the staged list beside this
  // control.
  if (withheld.some((fn) => !appliedFns.has(fn))) return 'count-distinct-spent';
  if (affordable.length > 0) return 'column-exhausted';

  // No trailing `return`: falling off the end is already `undefined`, which the
  // annotation admits, and every other empty is one of the cases above.
};

/**
 * The functions the drawer's "Add Aggregate" picker may still offer for the
 * chosen column, as select options — what the request can afford, minus what
 * the column already carries.
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
 * The **whole-request** rule composes for the same reason, one layer further
 * out: `resolveAffordableAggregates` withholds a second `countDistinct` from
 * both surfaces (#842), and it stays there rather than being folded in here,
 * because this util serves the picker alone and the header menu needs that rule
 * too.
 *
 * `gap` separates the ways the list can be empty, which the length alone cannot:
 * the read has no room for another distinct count, versus every legal function
 * is already applied, versus none was legal to begin with (an unaggregatable
 * column, an active group key, or no column chosen yet). Only the first two have
 * anything to say, and they say different things — the column list still offers
 * such a column, by design (#830 owns that list and does not subtract), so the
 * picker has to explain why it went quiet rather than render an empty control.
 */
export const resolveAddableAggregates = ({
  applied,
  capability,
  columnKey,
  isGroupKey,
}: ResolveAddableAggregatesArgs) => {
  const { affordable, withheld } = resolveAffordableAggregates({
    applied,
    capability,
    columnKey,
    isGroupKey,
  });
  const appliedFns = new Set(
    applied
      .filter((aggregate) => aggregate.columnKey === columnKey)
      .map((aggregate) => aggregate.fn),
  );
  const options = affordable
    .filter((fn) => !appliedFns.has(fn))
    .map((fn) => ({ label: TABLE_AGGREGATE_LABELS[fn], value: fn }));

  return {
    gap: resolveGap({
      affordable,
      appliedFns,
      hasOptions: options.length > 0,
      withheld,
    }),
    options,
  };
};
