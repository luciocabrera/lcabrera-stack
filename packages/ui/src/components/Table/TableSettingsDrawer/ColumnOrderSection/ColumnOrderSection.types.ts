import type { ComponentPropsWithoutRef } from 'react';

export type ColumnOrderSectionProps = ComponentPropsWithoutRef<'div'> & {
  readonly isBusy?: boolean;
};

export type {
  OrderConflictResolution,
  UnpinConflictResolution,
} from '#ui/types/pinningPreferences.types';
export type { PinConflictResolution, PinSide } from '#ui/types/ui.types';
