import type { ComponentPropsWithoutRef } from 'react';

export type ColumnOrderSectionProps = ComponentPropsWithoutRef<'div'> & {
  readonly isBusy?: boolean;
};

export type {
  OrderConflictResolution,
  UnpinConflictResolution,
} from '@lcabrera/ui/types/pinningPreferences.types';
export type {
  PinConflictResolution,
  PinSide,
} from '@lcabrera/ui/types/ui.types';
