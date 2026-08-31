import type { ComponentPropsWithoutRef } from 'react';

import type { TableColumnAggregate } from '#ui/components/Table/Table.types';

export type AggregateItem = TableColumnAggregate & {
  readonly id: string;
  readonly label: string;
};

export type AggregatePickerGap = 'column-exhausted' | 'count-distinct-spent';

export type GroupingSectionProps = ComponentPropsWithoutRef<'div'> & {
  readonly isBusy?: boolean;
};

export type GroupKeyItem = {
  readonly columnKey: string;
  readonly label: string;
};
