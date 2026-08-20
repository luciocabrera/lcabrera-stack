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

export type GroupingSectionProps = ComponentPropsWithoutRef<'div'> & {
  readonly isBusy?: boolean;
};

/** One applied group key, as the drawer list renders it. */
export type GroupKeyItem = {
  readonly columnKey: string;
  readonly label: string;
};
