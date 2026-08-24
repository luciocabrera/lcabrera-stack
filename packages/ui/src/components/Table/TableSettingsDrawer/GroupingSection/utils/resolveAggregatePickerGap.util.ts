import type { TableAggregateFn } from '#ui/components/Table/Table.types';

import type { AggregatePickerGap } from '../GroupingSection.types';

type ResolveAggregatePickerGapArgs = {
  readonly affordable: readonly TableAggregateFn[];
  readonly appliedFns: ReadonlySet<TableAggregateFn>;
  readonly hasOptions: boolean;
  readonly withheld: readonly TableAggregateFn[];
};

/**
 * Why the drawer's "Add Aggregate" picker has nothing to offer, or `undefined` while it
 * has something — the cause, never the fact, because an empty list is what every cause has
 * in common.
 * A function withheld for the read's `countDistinct` budget is a fact about the *rest* of
 * the configuration, so it outranks exhaustion: a column offered `count` and
 * `countDistinct` that carries `count` while another column carries the distinct count is
 * not "fully measured", and telling the user to remove one of this column's measures would
 * send them to the wrong control (#842).
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
