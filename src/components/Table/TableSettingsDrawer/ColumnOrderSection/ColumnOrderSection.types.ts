import type { ComponentPropsWithoutRef } from 'react';

export type ColumnOrderSectionProps = ComponentPropsWithoutRef<'div'>;

export type HandleToggleVisibilityArgs = {
  columnKey: string;
  isVisible: boolean;
};

export type PinConflictResolution = 'move-column' | 'pin-all-between';

export type SortOrderConflictResolution =
  | 'pin-to-match-order'
  | 'remove-conflicting-pins'
  | 'reset-all-pins';
