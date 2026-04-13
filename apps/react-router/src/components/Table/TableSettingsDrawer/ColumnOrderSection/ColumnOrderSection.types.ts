import type { ComponentPropsWithoutRef } from 'react';

export type ColumnOrderSectionProps = ComponentPropsWithoutRef<'div'>;

export type OrderConflictResolution =
  | 'pin-to-match-order'
  | 'remove-conflicting-pins'
  | 'reset-all-pins';

export type PinConflictResolution =
  | 'move-column'
  | 'pin-all-between'
  | 'pin-only';

export type { PinSide } from '@/types/ui.types';

export type UnpinConflictResolution = 'reorder-to-fill' | 'unpin-beyond';
