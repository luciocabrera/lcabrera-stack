import type { ComponentPropsWithoutRef } from 'react';

export type ColumnOrderSectionProps = ComponentPropsWithoutRef<'div'> & {
  readonly isBusy?: boolean;
};

export type {
  OrderConflictResolution,
  PinConflictResolution,
  UnpinConflictResolution,
} from '@/types/pinningPreferences.types';
export type { PinSide } from '@/types/ui.types';
