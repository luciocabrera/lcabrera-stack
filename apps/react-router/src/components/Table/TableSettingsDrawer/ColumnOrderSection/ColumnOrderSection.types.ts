import type { ComponentPropsWithoutRef } from 'react';

export type ColumnOrderSectionProps = ComponentPropsWithoutRef<'div'>;

export type {
  OrderConflictResolution,
  PinConflictResolution,
  UnpinConflictResolution,
} from '@/types/pinningPreferences.types';
export type { PinSide } from '@/types/ui.types';
