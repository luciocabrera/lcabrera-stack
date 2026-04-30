import type { ComponentPropsWithoutRef } from 'react';

export type ColumnOrderSectionProps = ComponentPropsWithoutRef<'div'>;

export type OrderConflictResolution =
  | 'pin-to-match-order'
  | 'remove-conflicting-pins'
  | 'reset-all-pins';

export type {
  PinConflictResolution,
  PinConflictResolutionPreferenceOption,
  PinSidePreferenceOption,
  UnpinConflictResolution,
  UnpinConflictResolutionPreferenceOption,
} from '@/types/pinningPreferences.types';
export type { PinSide } from '@/types/ui.types';
