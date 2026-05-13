import type { ComponentPropsWithoutRef } from 'react';

export type ColumnOrderSectionProps = ComponentPropsWithoutRef<'div'>;

export type {
  OrderConflictResolution,
  OrderConflictResolutionPreferenceOption,
  PinConflictResolution,
  PinConflictResolutionPreferenceOption,
  PinSidePreferenceOption,
  UnpinConflictResolution,
  UnpinConflictResolutionPreferenceOption,
} from '@/types/pinningPreferences.types';
export type { PinSide } from '@/types/ui.types';
