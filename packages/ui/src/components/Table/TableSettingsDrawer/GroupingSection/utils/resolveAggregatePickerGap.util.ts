import type { TableAggregateFn } from '#ui/components/Table/Table.types';

import type { AggregatePickerGap } from '../GroupingSection.types';

type ResolveAggregatePickerGapArgs = {
  /** What the read can afford on this column, before its own entries come off. */
  readonly affordable: readonly TableAggregateFn[];
  /** The functions this column already carries. */
  readonly appliedFns: ReadonlySet<TableAggregateFn>;
  /** Whether the picker has anything left to offer. */
  readonly hasOptions: boolean;
  /** What the read's budget withheld from this column (#842). */
  readonly withheld: readonly TableAggregateFn[];
};

/**
 * Why the drawer's "Add Aggregate" picker has nothing to offer, or `undefined`
 * while it has something — the cause, never the fact, because an empty list is
 * what every cause has in common.
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
export const resolveAggregatePickerGap = ({
  affordable,
  appliedFns,
  hasOptions,
  withheld,
}: ResolveAggregatePickerGapArgs): AggregatePickerGap | undefined => {
  if (hasOptions) return;
  // Only a withheld function this column could otherwise have *added*: one it
  // already carries is not a gap, it is an entry in the staged list beside this
  // control.
  if (withheld.some((fn) => !appliedFns.has(fn))) return 'count-distinct-spent';
  if (affordable.length > 0) return 'column-exhausted';

  // No trailing `return`: falling off the end is already `undefined`, which the
  // annotation admits, and every other empty is one of the cases above.
};
