import type { ComponentPropsWithoutRef } from 'react';

import type { TableColumnAggregate } from '#ui/components/Table/Table.types';

/** One applied aggregate, as the drawer list renders it. */
export type AggregateItem = {
  /**
   * The `(columnKey, fn)` pair as one string — the row's identity, since a
   * column may carry several measures and neither half is unique on its own.
   * Also the `DraggableItem.id` the reorder is expressed in.
   */
  readonly id: string;
  readonly label: string;
} & TableColumnAggregate;

/**
 * Why the "Add Aggregate" picker has no function to offer for the chosen
 * column — the two causes a user can act on, and they are acted on differently:
 * `column-exhausted` sends them to this column's own measures (#841), while
 * `count-distinct-spent` is about a measure on some other column (#842).
 *
 * Every other way the list can empty is `undefined` rather than a member here,
 * because it has nothing to tell anyone: no column is chosen yet, the column
 * takes no aggregate at all, or it is staged as a group key.
 */
export type AggregatePickerGap = 'column-exhausted' | 'count-distinct-spent';

export type GroupingSectionProps = ComponentPropsWithoutRef<'div'> & {
  readonly isBusy?: boolean;
};

/** One applied group key, as the drawer list renders it. */
export type GroupKeyItem = {
  readonly columnKey: string;
  readonly label: string;
};
