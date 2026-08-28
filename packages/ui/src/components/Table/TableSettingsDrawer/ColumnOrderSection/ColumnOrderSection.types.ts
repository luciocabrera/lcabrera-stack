import type { ComponentPropsWithoutRef } from 'react';

import type { TableAggregateFn } from '#ui/components/Table/Table.types';

export type ColumnGroupingChoice = 'group-key' | TableAggregateFn;

export type ColumnOrderSectionProps = ComponentPropsWithoutRef<'div'> & {
  readonly isBusy?: boolean;
};

export type {
  OrderConflictResolution,
  UnpinConflictResolution,
} from '#ui/types/pinningPreferences.types';
export type { PinConflictResolution, PinSide } from '#ui/types/ui.types';
