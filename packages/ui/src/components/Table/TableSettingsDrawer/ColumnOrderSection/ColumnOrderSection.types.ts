import type { ComponentPropsWithoutRef } from 'react';

import type { TableAggregateFn } from '#ui/components/Table/Table.types';

import type { AggregatePickerGap } from '../GroupingSection/GroupingSection.types';

export type ColumnGroupingChoice = 'group-key' | TableAggregateFn;

export type ColumnGroupingRefusal =
  | 'already-a-key'
  | 'key-cap-reached'
  | 'not-offered'
  | AggregatePickerGap;

export type ColumnOrderSectionProps = ComponentPropsWithoutRef<'div'> & {
  readonly isBusy?: boolean;
};

export type {
  OrderConflictResolution,
  UnpinConflictResolution,
} from '#ui/types/pinningPreferences.types';
export type { PinConflictResolution, PinSide } from '#ui/types/ui.types';
