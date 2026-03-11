import type { ComponentPropsWithoutRef } from 'react';

export type ColumnOrderSectionProps = ComponentPropsWithoutRef<'div'>;

export type HandleToggleVisibilityArgs = {
  columnKey: string;
  isVisible: boolean;
};

export type OrderConflictResolution =
  | 'pin-to-match-order'
  | 'remove-conflicting-pins'
  | 'reset-all-pins';

export type PinConflictResolution = 'move-column' | 'pin-all-between';
